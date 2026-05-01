'use client';

// dashboard-app/src/app/dashboard/channels/FacebookInstagramConnect.tsx
// Drop this component anywhere in your dashboard settings/channels page.
//
// It uses the Meta JavaScript SDK (Facebook Login) to get a user access token
// with the correct Pages + Instagram scopes, then sends it to /api/auth/meta/connect.
//
// Required: Add your Meta App ID to .env as META_APP_ID
// Required: Add the FB SDK script to your layout or load it here (handled below)

import { useEffect, useState } from 'react';

interface ConnectedPage {
  id: string;
  pageId: string;
  pageName: string;
  channel: 'FACEBOOK' | 'INSTAGRAM';
  chatwootInboxId: number | null;
  createdAt: string;
}

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID || '';

// These are the exact permissions needed for Pages messaging + Instagram DMs
const FB_PAGES_SCOPE = [
  'pages_show_list',
  'pages_messaging',
  'pages_read_engagement',
  'instagram_basic',
  'instagram_manage_messages',
].join(',');

export default function FacebookInstagramConnect() {
  const [sdkReady, setSdkReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [pages, setPages] = useState<ConnectedPage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load Meta JS SDK
  useEffect(() => {
    if (document.getElementById('facebook-jssdk')) {
      setSdkReady(true);
      return;
    }

    window.fbAsyncInit = () => {
      window.FB.init({
        appId: META_APP_ID,
        cookie: true,
        xfbml: false,
        version: 'v21.0',
      });
      setSdkReady(true);
    };

    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  // Fetch already-connected pages on mount
  useEffect(() => {
    fetchConnectedPages();
  }, []);

  async function fetchConnectedPages() {
    setLoading(true);
    try {
      const res = await fetch('/api/meta/pages');
      const data = await res.json();
      if (data.pages) setPages(data.pages);
    } catch {
      // silent — not blocking
    } finally {
      setLoading(false);
    }
  }

  function handleConnect() {
    if (!sdkReady || !window.FB) {
      setError('Facebook SDK not loaded yet. Try again in a moment.');
      return;
    }

    setError(null);
    setSuccess(null);

    window.FB.login(
      async (response: any) => {
        if (response.status !== 'connected' || !response.authResponse?.accessToken) {
          // User cancelled or denied
          return;
        }

        const fbAccessToken: string = response.authResponse.accessToken;
        setConnecting(true);

        try {
          const res = await fetch('/api/auth/meta/connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fbAccessToken }),
          });

          const data = await res.json();

          if (!res.ok || !data.success) {
            setError(data.error || 'Connection failed. Please try again.');
            return;
          }

          // Show summary of what was connected
          const summary = data.results
            ?.map((r: any) => {
              const parts = [];
              if (r.fb) parts.push('Facebook');
              if (r.ig) parts.push('Instagram');
              return `${r.page}: ${parts.join(' + ') || 'already connected'}`;
            })
            .join(' · ');

          setSuccess(summary || 'Connected successfully.');
          await fetchConnectedPages();
        } catch {
          setError('Unexpected error. Check your connection and try again.');
        } finally {
          setConnecting(false);
        }
      },
      {
        scope: FB_PAGES_SCOPE,
        return_scopes: true,
        auth_type: 'rerequest', // always re-ask for permissions in case user denied some
      }
    );
  }

  async function handleDisconnect(pageId: string, channel: 'FACEBOOK' | 'INSTAGRAM') {
    if (!confirm(`Disconnect ${channel === 'FACEBOOK' ? 'Facebook' : 'Instagram'} for this page?`)) return;

    try {
      await fetch(`/api/meta/pages?pageId=${pageId}&channel=${channel}`, {
        method: 'DELETE',
      });
      await fetchConnectedPages();
    } catch {
      setError('Failed to disconnect. Try again.');
    }
  }

  // Group pages by pageName for clean display
  const groupedPages = pages.reduce<Record<string, ConnectedPage[]>>((acc, p) => {
    if (!acc[p.pageName]) acc[p.pageName] = [];
    acc[p.pageName].push(p);
    return acc;
  }, {});

  const hasAnyConnected = pages.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Facebook & Instagram</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Connect your Pages to receive and reply to messages in your inbox.
          </p>
        </div>

        <button
          onClick={handleConnect}
          disabled={!sdkReady || connecting}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1877F2] text-white text-sm font-medium hover:bg-[#166FE5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {connecting ? (
            <>
              <Spinner />
              Connecting...
            </>
          ) : (
            <>
              <MetaIcon />
              {hasAnyConnected ? 'Connect More Pages' : 'Connect with Facebook'}
            </>
          )}
        </button>
      </div>

      {/* Feedback messages */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
          <span className="mt-0.5">⚠</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 border border-green-100 text-sm text-green-700">
          <span className="mt-0.5">✓</span>
          <span>{success}</span>
        </div>
      )}

      {/* Connected pages list */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
          <Spinner className="text-gray-400" />
          Loading connected pages...
        </div>
      ) : hasAnyConnected ? (
        <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
          {Object.entries(groupedPages).map(([pageName, connections]) => (
            <div key={pageName} className="bg-white px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-[#1877F2] flex items-center justify-center text-white text-xs font-bold">
                  {pageName[0]}
                </div>
                <span className="font-medium text-gray-900 text-sm">{pageName}</span>
              </div>
              <div className="flex flex-wrap gap-2 pl-9">
                {connections.map((conn) => (
                  <div
                    key={conn.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
                    style={
                      conn.channel === 'FACEBOOK'
                        ? { backgroundColor: '#EEF3FD', borderColor: '#C5D8FC', color: '#1877F2' }
                        : { backgroundColor: '#FDF0F8', borderColor: '#F3C6E8', color: '#C13584' }
                    }
                  >
                    {conn.channel === 'FACEBOOK' ? '📘' : '📷'}{' '}
                    {conn.channel === 'FACEBOOK' ? 'Messenger' : 'Instagram DMs'}
                    <button
                      onClick={() => handleDisconnect(conn.pageId, conn.channel)}
                      className="ml-1 opacity-50 hover:opacity-100 transition-opacity leading-none"
                      title="Disconnect"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center">
          <div className="text-3xl mb-2">📱</div>
          <p className="text-sm text-gray-500">No pages connected yet.</p>
          <p className="text-xs text-gray-400 mt-1">
            Click &quot;Connect with Facebook&quot; to link your Pages and Instagram accounts.
          </p>
        </div>
      )}

      {/* Permissions note */}
      <p className="text-xs text-gray-400">
        Repondly will request access to your Pages, Messenger, and Instagram Direct Messages only.
        We never post on your behalf.
      </p>
    </div>
  );
}

function MetaIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function Spinner({ className = 'text-white' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin h-4 w-4 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

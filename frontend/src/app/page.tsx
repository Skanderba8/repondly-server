export default function Home() {
  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --white: #ffffff; --off: #f7f6f3; --ink: #111110; --mid: #6b6b67;
          --light: #d4d3ce; --accent: #2563eb; --accent-soft: #eff4ff;
          --radius: 16px; --radius-sm: 8px;
        }
        html { scroll-behavior: smooth; }
        body {
          font-family: 'DM Sans', sans-serif; background: var(--white);
          color: var(--ink); overflow-x: hidden; -webkit-font-smoothing: antialiased;
        }
        nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 48px; background: rgba(255,255,255,0.85);
          backdrop-filter: blur(16px); border-bottom: 1px solid transparent;
          transition: border-color 0.3s;
        }
        nav.scrolled { border-color: var(--light); }
        .nav-logo {
          font-family: 'DM Serif Display', serif; font-size: 1.4rem;
          letter-spacing: -0.02em; color: var(--ink); text-decoration: none;
          display: flex; align-items: center; gap: 10px;
        }
        .nav-logo span { color: var(--accent); }
        .nav-logo img { width: 32px; height: 32px; object-fit: contain; }
        .nav-links { display: flex; gap: 36px; list-style: none; }
        .nav-links a {
          font-size: 0.875rem; font-weight: 400; color: var(--mid);
          text-decoration: none; transition: color 0.2s;
        }
        .nav-links a:hover { color: var(--ink); }
        .nav-right { display: flex; align-items: center; gap: 12px; }
        .nav-signin {
          color: var(--mid); font-size: 0.875rem; font-weight: 400;
          text-decoration: none; transition: color 0.2s; padding: 10px 4px;
        }
        .nav-signin:hover { color: var(--ink); }
        .nav-cta {
          background: var(--ink); color: var(--white);
          padding: 10px 22px; border-radius: 100px;
          font-size: 0.875rem; font-weight: 500;
          text-decoration: none; transition: background 0.2s, transform 0.15s;
        }
        .nav-cta:hover { background: var(--accent); transform: translateY(-1px); }
        .hero {
          min-height: 100vh; display: flex; flex-direction: column;
          align-items: center; justify-content: center; text-align: center;
          padding: 120px 24px 80px; position: relative; overflow: hidden;
        }
        .hero-bg {
          position: absolute; inset: 0; z-index: 0;
          background: radial-gradient(ellipse 70% 50% at 50% -10%, #dbeafe 0%, transparent 60%),
            radial-gradient(ellipse 40% 30% at 80% 90%, #e0f2fe 0%, transparent 50%);
        }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--accent-soft); color: var(--accent);
          padding: 6px 14px; border-radius: 100px;
          font-size: 0.8rem; font-weight: 500;
          margin-bottom: 28px; position: relative; z-index: 1;
          opacity: 0; animation: fadeUp 0.6s 0.1s forwards;
        }
        .hero-badge::before {
          content: ''; width: 6px; height: 6px; border-radius: 50%;
          background: var(--accent); display: block; animation: pulse 2s infinite;
        }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }
        .hero h1 {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(3rem, 7vw, 5.5rem); line-height: 1.08;
          letter-spacing: -0.03em; max-width: 800px;
          position: relative; z-index: 1;
          opacity: 0; animation: fadeUp 0.7s 0.25s forwards;
        }
        .hero h1 em { font-style: italic; color: var(--accent); }
        .hero-sub {
          font-size: clamp(1rem, 2vw, 1.2rem); color: var(--mid);
          font-weight: 300; line-height: 1.6; max-width: 520px; margin-top: 24px;
          position: relative; z-index: 1; opacity: 0; animation: fadeUp 0.7s 0.4s forwards;
        }
        .hero-actions {
          display: flex; gap: 14px; margin-top: 40px;
          position: relative; z-index: 1;
          opacity: 0; animation: fadeUp 0.7s 0.55s forwards;
          flex-wrap: wrap; justify-content: center;
        }
        .btn-primary {
          background: var(--ink); color: var(--white);
          padding: 14px 32px; border-radius: 100px;
          font-size: 0.95rem; font-weight: 500; text-decoration: none;
          transition: all 0.2s; box-shadow: 0 4px 20px rgba(0,0,0,0.12);
        }
        .btn-primary:hover { background: var(--accent); transform: translateY(-2px); box-shadow: 0 8px 28px rgba(37,99,235,0.25); }
        .btn-secondary {
          background: transparent; color: var(--ink);
          padding: 14px 32px; border-radius: 100px;
          font-size: 0.95rem; font-weight: 500; text-decoration: none;
          border: 1.5px solid var(--light); transition: all 0.2s;
        }
        .btn-secondary:hover { border-color: var(--ink); transform: translateY(-2px); }
        .hero-mockup {
          position: relative; z-index: 1; margin-top: 72px;
          width: 100%; max-width: 780px;
          opacity: 0; animation: fadeUp 0.8s 0.7s forwards;
        }
        .mockup-shell {
          background: var(--white); border: 1px solid var(--light);
          border-radius: 20px; box-shadow: 0 8px 60px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04);
          overflow: hidden;
        }
        .mockup-bar {
          background: var(--off); padding: 14px 20px;
          display: flex; align-items: center; gap: 8px;
          border-bottom: 1px solid var(--light);
        }
        .dot { width: 10px; height: 10px; border-radius: 50%; }
        .dot-r { background: #ff5f57; } .dot-y { background: #ffbd2e; } .dot-g { background: #28c840; }
        .mockup-bar-title { flex: 1; text-align: center; font-size: 0.78rem; color: var(--mid); font-weight: 400; }
        .mockup-body { padding: 28px 28px 32px; }
        .chat-row { display: flex; gap: 10px; margin-bottom: 16px; }
        .chat-row.right { flex-direction: row-reverse; }
        .avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: var(--accent-soft); flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.75rem; color: var(--accent); font-weight: 600;
        }
        .avatar.bot { background: var(--ink); color: var(--white); }
        .bubble { max-width: 68%; padding: 10px 16px; border-radius: 16px; font-size: 0.875rem; line-height: 1.55; }
        .bubble.incoming { background: var(--off); color: var(--ink); border-bottom-left-radius: 4px; }
        .bubble.outgoing { background: var(--accent); color: white; border-bottom-right-radius: 4px; }
        .typing { display: flex; gap: 4px; padding: 12px 16px; background: var(--off); border-radius: 16px; border-bottom-left-radius: 4px; width: fit-content; }
        .typing span { width: 6px; height: 6px; border-radius: 50%; background: var(--mid); animation: blink 1.2s infinite; }
        .typing span:nth-child(2) { animation-delay: 0.2s; }
        .typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes blink { 0%,80%,100%{opacity:0.3} 40%{opacity:1} }
        section { padding: 100px 24px; }
        .container { max-width: 1100px; margin: 0 auto; }
        .section-label { font-size: 0.78rem; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent); margin-bottom: 16px; }
        .section-title { font-family: 'DM Serif Display', serif; font-size: clamp(2rem, 4vw, 3rem); line-height: 1.15; letter-spacing: -0.025em; max-width: 560px; }
        .section-sub { color: var(--mid); font-size: 1.05rem; font-weight: 300; line-height: 1.7; max-width: 480px; margin-top: 14px; }
        #features { background: var(--off); }
        .features-header { text-align: center; margin-bottom: 64px; }
        .features-header .section-title, .features-header .section-sub { max-width: 600px; margin-inline: auto; }
        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; }
        .feature-card { background: var(--white); border: 1px solid var(--light); border-radius: var(--radius); padding: 32px; transition: box-shadow 0.2s, transform 0.2s; }
        .feature-card:hover { box-shadow: 0 12px 40px rgba(0,0,0,0.07); transform: translateY(-4px); }
        .feature-icon { width: 44px; height: 44px; border-radius: 12px; background: var(--accent-soft); display: flex; align-items: center; justify-content: center; font-size: 1.3rem; margin-bottom: 20px; }
        .feature-card h3 { font-family: 'DM Serif Display', serif; font-size: 1.2rem; margin-bottom: 10px; letter-spacing: -0.01em; }
        .feature-card p { color: var(--mid); font-size: 0.9rem; line-height: 1.65; font-weight: 300; }
        .how-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .steps { display: flex; flex-direction: column; gap: 32px; }
        .step { display: flex; gap: 20px; }
        .step-num { width: 36px; height: 36px; border-radius: 50%; background: var(--accent); color: white; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 600; flex-shrink: 0; margin-top: 2px; }
        .step h4 { font-family: 'DM Serif Display', serif; font-size: 1.1rem; margin-bottom: 6px; letter-spacing: -0.01em; }
        .step p { color: var(--mid); font-size: 0.875rem; line-height: 1.65; font-weight: 300; }
        .how-visual { background: var(--off); border: 1px solid var(--light); border-radius: var(--radius); padding: 40px; display: flex; flex-direction: column; gap: 16px; }
        .flow-item { display: flex; align-items: center; gap: 14px; background: white; border: 1px solid var(--light); border-radius: var(--radius-sm); padding: 14px 18px; font-size: 0.875rem; font-weight: 400; }
        .flow-item .fi-icon { font-size: 1.1rem; width: 28px; text-align: center; }
        .flow-arrow { text-align: center; color: var(--light); font-size: 1.2rem; }
        #pricing { background: var(--ink); color: var(--white); }
        #pricing .section-title { color: var(--white); }
        #pricing .section-sub { color: rgba(255,255,255,0.5); }
        .pricing-wrapper { display: flex; gap: 40px; align-items: flex-start; flex-wrap: wrap; }
        .pricing-left { flex: 1; min-width: 260px; }
        .pricing-card { flex: 1; min-width: 300px; background: white; color: var(--ink); border-radius: var(--radius); padding: 44px 40px; position: relative; overflow: hidden; }
        .pricing-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--accent); }
        .price-label { font-size: 0.78rem; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: var(--mid); margin-bottom: 12px; }
        .price-amount { font-family: 'DM Serif Display', serif; font-size: 3.5rem; line-height: 1; letter-spacing: -0.04em; }
        .price-amount span { font-family: 'DM Sans', sans-serif; font-size: 1.2rem; font-weight: 300; color: var(--mid); }
        .price-setup { font-size: 0.85rem; color: var(--mid); margin-top: 8px; margin-bottom: 32px; padding-bottom: 32px; border-bottom: 1px solid var(--light); }
        .price-features { list-style: none; display: flex; flex-direction: column; gap: 14px; margin-bottom: 36px; }
        .price-features li { display: flex; gap: 10px; font-size: 0.9rem; align-items: flex-start; }
        .price-features li::before { content: '✓'; color: var(--accent); font-weight: 600; flex-shrink: 0; }
        .price-cta { display: block; text-align: center; background: var(--ink); color: white; padding: 14px; border-radius: 100px; font-size: 0.95rem; font-weight: 500; text-decoration: none; transition: all 0.2s; }
        .price-cta:hover { background: var(--accent); transform: translateY(-2px); }
        .faq-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .faq-item { border: 1px solid var(--light); border-radius: var(--radius); padding: 28px; cursor: pointer; transition: box-shadow 0.2s; }
        .faq-item:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.06); }
        .faq-q { font-family: 'DM Serif Display', serif; font-size: 1rem; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
        .faq-q .icon { color: var(--mid); flex-shrink: 0; transition: transform 0.2s; }
        .faq-item.open .faq-q .icon { transform: rotate(45deg); }
        .faq-a { color: var(--mid); font-size: 0.875rem; line-height: 1.7; font-weight: 300; display: none; }
        .faq-item.open .faq-a { display: block; }
        #contact { background: var(--off); }
        .contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .contact-form { display: flex; flex-direction: column; gap: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group label { font-size: 0.8rem; font-weight: 500; color: var(--mid); letter-spacing: 0.04em; text-transform: uppercase; }
        .form-group input, .form-group textarea, .form-group select { background: white; border: 1px solid var(--light); border-radius: var(--radius-sm); padding: 12px 16px; font-family: 'DM Sans', sans-serif; font-size: 0.9rem; color: var(--ink); outline: none; transition: border-color 0.2s; resize: none; }
        .form-group input:focus, .form-group textarea:focus, .form-group select:focus { border-color: var(--accent); }
        .form-submit { background: var(--ink); color: white; border: none; padding: 14px; border-radius: 100px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 0.95rem; font-weight: 500; transition: all 0.2s; margin-top: 4px; }
        .form-submit:hover { background: var(--accent); transform: translateY(-2px); }
        footer { padding: 40px 48px; border-top: 1px solid var(--light); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
        .footer-logo { font-family: 'DM Serif Display', serif; font-size: 1.2rem; color: var(--ink); text-decoration: none; letter-spacing: -0.02em; display: flex; align-items: center; gap: 8px; }
        .footer-logo span { color: var(--accent); }
        .footer-logo img { width: 24px; height: 24px; object-fit: contain; }
        footer p { color: var(--mid); font-size: 0.8rem; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        .reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.65s ease, transform 0.65s ease; }
        .reveal.visible { opacity: 1; transform: translateY(0); }
        @media (max-width: 768px) {
          nav { padding: 16px 20px; }
          .nav-links { display: none; }
          .how-grid, .contact-grid { grid-template-columns: 1fr; gap: 40px; }
          .faq-grid { grid-template-columns: 1fr; }
          .pricing-wrapper { flex-direction: column; }
          footer { flex-direction: column; text-align: center; }
        }
      `}</style>

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />

      <nav id="nav">
        <a href="#" className="nav-logo">
          <img src="/public/Slogo.png" alt="Repondly" />
          Répondly<span>.</span>
        </a>
        <ul className="nav-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#how">How it works</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="#faq">FAQ</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
        <div className="nav-right">
          <a href="/auth/signin" className="nav-signin">Sign in</a>
          <a href="#contact" className="nav-cta">Get started</a>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-bg"></div>
        <div className="hero-badge">Now available in Tunisia</div>
        <h1>AI Customer Service<br/>for <em>Tunisian</em> Businesses</h1>
        <p className="hero-sub">Automate your WhatsApp conversations, book appointments, and never miss a client — in Arabic, French, or Darija.</p>
        <div className="hero-actions">
          <a href="#contact" className="btn-primary">Book a free demo</a>
          <a href="#features" className="btn-secondary">See what&apos;s included</a>
        </div>
        <div className="hero-mockup">
          <div className="mockup-shell">
            <div className="mockup-bar">
              <div className="dot dot-r"></div>
              <div className="dot dot-y"></div>
              <div className="dot dot-g"></div>
              <div className="mockup-bar-title">WhatsApp — Répondly Bot</div>
            </div>
            <div className="mockup-body">
              <div className="chat-row">
                <div className="avatar">C</div>
                <div className="bubble incoming">Bonjour, je veux savoir comment ça marche votre service 👋</div>
              </div>
              <div className="chat-row right">
                <div className="avatar bot">R</div>
                <div className="bubble outgoing">Bonjour ! Bienvenue chez Répondly 😊 Nous automatisons votre service client sur WhatsApp. Qu&apos;est-ce qui vous intéresse le plus : les réponses automatiques, la prise de RDV, ou les rappels ?</div>
              </div>
              <div className="chat-row">
                <div className="avatar">C</div>
                <div className="bubble incoming">La prise de rendez-vous, je voudrais voir ça</div>
              </div>
              <div className="chat-row right">
                <div className="avatar bot">R</div>
                <div className="bubble outgoing">Parfait ! Je peux vous réserver un appel de 30 min avec notre équipe pour vous montrer tout ça. Vous préférez quand — cette semaine ou la semaine prochaine ? 📅</div>
              </div>
              <div className="chat-row">
                <div className="avatar">C</div>
                <div className="typing"><span></span><span></span><span></span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features">
        <div className="container">
          <div className="features-header reveal">
            <div className="section-label">What&apos;s included</div>
            <h2 className="section-title">Everything your business needs to respond faster</h2>
            <p className="section-sub">One flat monthly subscription. No hidden fees. No per-message billing.</p>
          </div>
          <div className="features-grid">
            {[
              { icon: '🤖', title: 'AI Responses', desc: 'Your bot answers customer questions 24/7 in Arabic, French, or Darija — naturally, consistently, and in your brand\'s tone.' },
              { icon: '📅', title: 'Appointment Booking', desc: 'Clients book directly through WhatsApp. Appointments sync to your calendar automatically — no back and forth needed.' },
              { icon: '🔔', title: 'Smart Reminders', desc: 'Automated reminders sent to your clients before their appointment, and instant notifications to you when something needs attention.' },
              { icon: '💬', title: 'Comment Replies', desc: 'Automatically respond to comments on your social media pages with relevant, personalized replies — while you focus on your business.' },
              { icon: '🌍', title: 'Multilingual by Default', desc: 'The bot detects the language your client uses and replies accordingly — no setup required, works seamlessly from day one.' },
              { icon: '👤', title: 'Human Handoff', desc: 'When a client needs personal attention, the bot smoothly transfers the conversation to a real agent — nothing falls through the cracks.' },
            ].map((f) => (
              <div className="feature-card reveal" key={f.title}>
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how">
        <div className="container">
          <div className="how-grid">
            <div className="reveal">
              <div className="section-label">How it works</div>
              <h2 className="section-title">Up and running in 48 hours</h2>
              <p className="section-sub" style={{marginBottom:'48px'}}>We handle the full setup. You just show up and talk to your clients.</p>
              <div className="steps">
                {[
                  { n:'1', title:'Book a free demo call', desc:'We walk you through the platform and understand your business needs in 30 minutes.' },
                  { n:'2', title:'We configure your bot', desc:'We set up your AI assistant with your business info, tone, and services — ready in 48h.' },
                  { n:'3', title:'Go live on WhatsApp', desc:'Your bot starts handling conversations, booking appointments, and sending reminders automatically.' },
                  { n:'4', title:'You stay in control', desc:'View all conversations, step in at any time, and get notified for anything important.' },
                ].map((s) => (
                  <div className="step" key={s.n}>
                    <div className="step-num">{s.n}</div>
                    <div><h4>{s.title}</h4><p>{s.desc}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="how-visual reveal">
              {[
                { icon:'📲', text:'Client sends a WhatsApp message' },
                { icon:'🧠', text:'AI detects language and intent' },
                { icon:'💬', text:'Bot replies with relevant info' },
                { icon:'📅', text:'Client books an appointment' },
                { icon:'✅', text:'Calendar event created automatically' },
                { icon:'🔔', text:'You get notified instantly' },
              ].map((item, i) => (
                <div key={i}>
                  <div className="flow-item"><span className="fi-icon">{item.icon}</span>{item.text}</div>
                  {i < 5 && <div className="flow-arrow">↓</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing">
        <div className="container">
          <div className="pricing-wrapper">
            <div className="pricing-left reveal">
              <div className="section-label" style={{color:'rgba(255,255,255,0.4)'}}>Pricing</div>
              <h2 className="section-title">Simple, honest pricing.</h2>
              <p className="section-sub" style={{marginTop:'16px'}}>One plan. Everything included. No contracts, cancel anytime.</p>
              <div style={{marginTop:'40px',display:'flex',flexDirection:'column',gap:'12px'}}>
                {['30-day free trial available','Full setup handled by our team','Support included'].map(t => (
                  <p key={t} style={{fontSize:'0.875rem',color:'rgba(255,255,255,0.4)',display:'flex',alignItems:'center',gap:'8px'}}><span style={{color:'#2563eb'}}>✓</span>{t}</p>
                ))}
              </div>
            </div>
            <div className="pricing-card reveal">
              <div className="price-label">Monthly plan</div>
              <div className="price-amount">79 DT<span> / month</span></div>
              <div className="price-setup">+ 29 DT one-time setup fee</div>
              <ul className="price-features">
                {['AI-powered responses in Arabic, French and Darija','Appointment booking directly on WhatsApp','Automatic calendar sync','Smart reminders for you and your clients','Comment reply automation','Human handoff when needed','Instant push notifications','Full setup included'].map(f => <li key={f}>{f}</li>)}
              </ul>
              <a href="#contact" className="price-cta">Get started today</a>
            </div>
          </div>
        </div>
      </section>

      <section id="faq">
        <div className="container">
          <div style={{textAlign:'center',marginBottom:'56px'}} className="reveal">
            <div className="section-label">FAQ</div>
            <h2 className="section-title" style={{marginInline:'auto'}}>Questions you might have</h2>
          </div>
          <div className="faq-grid" id="faqGrid">
            {[
              { q:'Does it work with my existing WhatsApp number?', a:'Yes — we connect the bot to your business WhatsApp number using the official WhatsApp Business API. Your number stays the same and your clients won\'t notice a difference.' },
              { q:'Can I customize what the bot says?', a:'Absolutely. During setup, we tailor the bot\'s tone, the information it shares, and how it handles specific questions based on your business. You can request changes at any time.' },
              { q:'What if a client asks something the bot doesn\'t know?', a:'The bot will gracefully let the client know it\'s transferring them to a human agent. You get notified immediately and can take over the conversation from your phone.' },
              { q:'How does appointment booking work exactly?', a:'The bot asks for the client\'s preferred time, confirms their booking in the chat, and creates a calendar event. You receive a push notification and the client gets a reminder before the appointment.' },
              { q:'Is my data secure?', a:'Yes. All data is stored on private servers and we never sell or share your business or client information. Conversations are only accessible to you and your team.' },
              { q:'Can I cancel at any time?', a:'Yes, there are no long-term contracts. You can cancel your subscription at any time with no penalties. The 29 DT setup fee is one-time and non-refundable.' },
            ].map((item) => (
              <div className="faq-item reveal" key={item.q}>
                <div className="faq-q">{item.q}<span className="icon">+</span></div>
                <div className="faq-a">{item.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact">
        <div className="container">
          <div className="contact-grid">
            <div className="reveal">
              <div className="section-label">Book a demo</div>
              <h2 className="section-title">Let&apos;s talk about your business</h2>
              <p className="section-sub" style={{marginTop:'16px'}}>Fill in the form and we&apos;ll reach out within 24 hours to schedule a free 30-minute demo call — no commitment required.</p>
              <div style={{marginTop:'40px',display:'flex',flexDirection:'column',gap:'16px'}}>
                {[
                  { icon:'📍', text:'Based in Tunisia — serving businesses nationwide' },
                  { icon:'⏱', text:'Demo calls are 30 minutes, free of charge' },
                  { icon:'🌍', text:'Available in Arabic, French, and Darija' },
                ].map(i => (
                  <div key={i.text} style={{display:'flex',alignItems:'center',gap:'12px',fontSize:'0.875rem',color:'var(--mid)'}}>
                    <span style={{fontSize:'1.1rem'}}>{i.icon}</span>{i.text}
                  </div>
                ))}
              </div>
            </div>
            <div className="contact-form reveal">
              <div className="form-group"><label>Full name</label><input type="text" placeholder="Ahmed Ben Ali" /></div>
              <div className="form-group"><label>WhatsApp number</label><input type="tel" placeholder="+216 XX XXX XXX" /></div>
              <div className="form-group">
                <label>Business type</label>
                <select>
                  <option value="">Select your sector</option>
                  {['Medical / Clinic','Beauty & Wellness','Retail / E-commerce','Real Estate','Education / Tutoring','Restaurant / Food','Other'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="form-group"><label>What would you like to automate?</label><textarea rows={3} placeholder="Ex: appointment booking, FAQ responses, reminders..."></textarea></div>
              <button className="form-submit" id="submitBtn">Send my request →</button>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <a href="#" className="footer-logo">
          <img src="/logo.png" alt="Repondly" />
          Répondly<span>.</span>
        </a>
        <p>© 2026 Répondly. All rights reserved.</p>
        <p style={{fontSize:'0.8rem',color:'var(--mid)'}}>Made in Tunisia</p>
      </footer>

      <script dangerouslySetInnerHTML={{__html: `
        const nav = document.getElementById('nav');
        window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 20));
        const reveals = document.querySelectorAll('.reveal');
        const observer = new IntersectionObserver((entries) => {
          entries.forEach((e, i) => {
            if (e.isIntersecting) { setTimeout(() => e.target.classList.add('visible'), i * 60); observer.unobserve(e.target); }
          });
        }, { threshold: 0.1 });
        reveals.forEach(el => observer.observe(el));
        document.querySelectorAll('.faq-item').forEach(item => {
          item.addEventListener('click', () => {
            const wasOpen = item.classList.contains('open');
            document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
            if (!wasOpen) item.classList.add('open');
          });
        });
        const btn = document.getElementById('submitBtn');
        if (btn) btn.addEventListener('click', () => {
          btn.textContent = '✓ Request sent!';
          btn.style.background = '#16a34a';
          btn.disabled = true;
        });
      `}} />
    </>
  )
}
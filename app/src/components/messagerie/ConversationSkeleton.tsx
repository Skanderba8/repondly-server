import SkeletonCard from '@/components/ui/SkeletonCard'

export default function ConversationSkeleton() {
  return (
    <div>
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

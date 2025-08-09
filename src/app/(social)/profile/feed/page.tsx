import CreatePostCard from '@/components/cards/CreatePostCard'
import RealFeeds from '@/app/(social)/feed/(container)/home/components/RealFeeds'
import PageMetaData from '@/components/PageMetaData'

const Feed = () => {
  return (
    <>
    <PageMetaData title='Feed'/>
      <CreatePostCard />
      <RealFeeds />
    </>
  )
}
export default Feed

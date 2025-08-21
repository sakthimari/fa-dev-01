import { Link } from 'react-router-dom'
import { useEffect, useRef, useState, type FC } from 'react'
import Zuck from 'zuck.js'

// Note: CSS is imported through the main SCSS file to avoid import issues

type Story = {
  id: string
  name: string
  photo: string
  time: number
  items: {
    id: string
    src: string
    type: string
    preview?: string
    length: number
    text?: string
    link: string
    linkText: boolean
    time: number
  }[]
}

type StoryComponentProps = {
  stories: Story[]
}

const StoryComponent: FC<StoryComponentProps> = ({ stories }) => {
  const storiesRef = useRef<HTMLDivElement>(null)
  const storiesFunc = useRef<any>(null)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (storiesRef.current && !storiesFunc.current && stories.length > 0 && !hasError) {
      try {
        storiesFunc.current = new Zuck(storiesRef.current, {
          reactive: true,
          previousTap: true,
          skin: 'snapgram',
          autoFullScreen: false,
          avatars: true,
          list: false,
          openEffect: true,
          cubeEffect: true,
          backButton: true,
          rtl: false,
          localStorage: false,
          backNative: true,
          stories: stories,
        })
      } catch (error) {
        console.error('Error initializing Zuck stories:', error)
        setHasError(true)
      }
    }

    return () => {
      if (storiesFunc.current) {
        try {
          storiesFunc.current.remove()
          storiesFunc.current = null
        } catch (error) {
          console.error('Error cleaning up Zuck stories:', error)
        }
      }
    }
  }, [stories, hasError])

  // Fallback UI if Zuck.js fails to load
  if (hasError) {
    return (
      <div className="stories d-flex gap-3 overflow-auto py-3">
        {stories.slice(0, 6).map((story) => (
          <div key={story.id} className="story text-center">
            <a href="#" className="item-link" onClick={(e) => e.preventDefault()}>
              <div className="item-preview">
                <img src={story.photo} alt={story.name} />
              </div>
              <div className="info">
                <span className="name">{story.name}</span>
              </div>
            </a>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div ref={storiesRef} className="storiesWrapper stories-square carousel scroll-enable stories">
      {stories.map((story) => {
        return (
          <div key={story.id} className="story" data-id={story.id} data-photo={story.photo} data-last-updated={story.time}>
            <Link className="item-link" to="" onClick={(e) => e.preventDefault()}>
              <span className="item-preview">
                <img loading="eager" src={story.photo} alt="story" />
              </span>
              <span className="info" itemProp="author" itemScope itemType="http://schema.org/Person">
                <strong className="name" itemProp="name">
                  {story.name}
                </strong>
                <span className="time" />
              </span>
            </Link>
            <ul className="items">
              {story.items.map((storyItem) => {
                return (
                  <li 
                    key={storyItem.id} 
                    data-id={storyItem.id} 
                    data-src={storyItem.src} 
                    data-type={storyItem.type} 
                    data-length={storyItem.length} 
                    data-link={storyItem.link} 
                    data-linktext={storyItem.linkText ? "true" : "false"}
                  >
                    {storyItem.preview && <img src={storyItem.preview} width="64" height="90" alt="story item" />}
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

export default StoryComponent

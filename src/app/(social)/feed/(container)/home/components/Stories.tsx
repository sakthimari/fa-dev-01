
import { Button, Card } from 'react-bootstrap'
import { FaPlus, FaChevronLeft, FaChevronRight } from 'react-icons/fa6'
import { useRef, useState } from 'react'

import post2 from '@/assets/images/post/1by1/02.jpg'
import albums1 from '@/assets/images/albums/01.jpg'
import albums2 from '@/assets/images/albums/02.jpg'
import albums3 from '@/assets/images/albums/03.jpg'
import albums4 from '@/assets/images/albums/04.jpg'
import albums5 from '@/assets/images/albums/05.jpg'
import albums6 from '@/assets/images/albums/06.jpg'

import post3 from '@/assets/images/post/1by1/03.jpg'
import post4 from '@/assets/images/post/1by1/04.jpg'
import post5 from '@/assets/images/post/1by1/05.jpg'
import post6 from '@/assets/images/post/1by1/06.jpg'
import post7 from '@/assets/images/post/1by1/07.jpg'

const timestamp = () => {
  const timeIndex = 1678166046264 / 1000
  const random = Math.floor(Math.random() * 1000)
  return Math.round(timeIndex - random)
}

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

const stories: Story[] = [
  {
    id: '1',
    name: 'Judy Nguyen',
    photo: post2,
    time: timestamp(),
    items: [
      {
        id: 'story-1',
        type: 'photo',
        length: 5,
        src: albums1,
        preview: albums1,
        link: '',
        linkText: false,
        time: timestamp(),
      },
      {
        id: 'story-2',
        type: 'video',
        length: 0,
        src: '/videos/video-call.mp4',
        preview: '',
        link: '',
        linkText: false,
        time: timestamp(),
      },
      {
        id: 'story-3',
        type: 'photo',
        length: 5,
        src: albums2,
        preview: albums2,
        link: '',
        linkText: false,
        time: timestamp(),
      },
    ],
  },
  {
    id: '2',
    name: 'Michael Jordan',
    photo: post3,
    time: timestamp(),
    items: [
      {
        id: 'story-4',
        length: 5,
        src: albums2,
        type: 'photo',
        link: '',
        linkText: false,
        time: timestamp(),
      },
    ],
  },
  {
    id: '3',
    name: 'Billy Vasquez',
    photo: post3,
    time: timestamp(),
    items: [
      {
        id: 'story-5',
        length: 5,
        src: albums3,
        type: 'photo',
        link: '',
        linkText: false,
        time: timestamp(),
      },
    ],
  },
  {
    id: '4',
    name: 'Amanda Reed',
    photo: post4,
    time: timestamp(),
    items: [
      {
        id: 'story-6',
        length: 5,
        src: albums4,
        type: 'photo',
        link: '',
        linkText: false,
        time: timestamp(),
      },
    ],
  },
  {
    id: '5',
    name: 'Lori Stevens',
    photo: post5,
    time: timestamp(),
    items: [
      {
        id: 'story-7',
        length: 5,
        src: albums5,
        type: 'photo',
        link: '',
        linkText: false,
        time: timestamp(),
      },
    ],
  },
  {
    id: '6',
    name: 'Samuel Bishop',
    photo: post6,
    time: timestamp(),
    items: [
      {
        id: 'story-8',
        length: 5,
        src: albums6,
        type: 'photo',
        link: '',
        linkText: false,
        time: timestamp(),
      },
    ],
  },
  {
    id: '7',
    name: 'Joan Wallace',
    photo: post7,
    time: timestamp(),
    items: [
      {
        id: 'story-9',
        length: 5,
        src: albums6,
        type: 'photo',
        link: '',
        linkText: false,
        time: timestamp(),
      },
    ],
  },
  {
    id: '8',
    name: 'Carolyn Ortiz',
    photo: albums5,
    time: timestamp(),
    items: [
      {
        id: 'story-10',
        length: 3,
        src: albums5,
        type: 'photo',
        link: '',
        linkText: false,
        time: timestamp(),
      },
    ],
  },
  {
    id: '9',
    name: 'Samuel Bishop',
    photo: post6,
    time: timestamp(),
    items: [
      {
        id: 'story-11',
        length: 5,
        src: albums6,
        type: 'photo',
        link: '',
        linkText: false,
        time: timestamp(),
      },
    ],
  },
  {
    id: '10',
    name: 'Carolyn Ortiz',
    photo: albums5,
    time: timestamp(),
    items: [
      {
        id: 'story-12',
        length: 3,
        src: albums5,
        type: 'photo',
        link: '',
        linkText: false,
        time: timestamp(),
      },
    ],
  },
]

const Stories = () => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showControls, setShowControls] = useState(false)

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -140, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 140, behavior: 'smooth' })
    }
  }

  return (
    <div 
      className="position-relative"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Left Arrow */}
      {showControls && (
        <Button
          variant="light"
          className="position-absolute top-50 start-0 translate-middle-y rounded-circle p-2 shadow-sm"
          style={{ zIndex: 10, width: '32px', height: '32px' }}
          onClick={scrollLeft}
        >
          <FaChevronLeft size={12} />
        </Button>
      )}

      {/* Right Arrow */}
      {showControls && (
        <Button
          variant="light"
          className="position-absolute top-50 end-0 translate-middle-y rounded-circle p-2 shadow-sm"
          style={{ zIndex: 10, width: '32px', height: '32px' }}
          onClick={scrollRight}
        >
          <FaChevronRight size={12} />
        </Button>
      )}

      {/* Stories Container */}
      <div 
        ref={scrollRef}
        className="d-flex gap-2 mb-n3 stories-scroll"
        style={{
          overflowX: 'auto',
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none' // IE/Edge
        }}
      >
        <style>{`
          .stories-scroll::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        
        <div className="position-relative flex-shrink-0">
          <Card className="border border-2 border-dashed h-150px px-4 px-sm-5 shadow-none d-flex align-items-center justify-content-center text-center">
            <div>
              <Button variant="light" className="stretched-link rounded-circle icon-md">
                <FaPlus />
              </Button>
              <h6 className="mt-2 mb-0 small">Post a Story</h6>
            </div>
          </Card>
        </div>
        
        {/* Story cards */}
        {stories.slice(0, 8).map((story) => (
          <div key={story.id} className="position-relative flex-shrink-0" style={{ width: '120px' }}>
            <Card className="h-150px shadow-none border-0 overflow-hidden rounded">
              <div className="h-100 position-relative">
                <img 
                  loading="eager" 
                  src={story.photo} 
                  alt={story.name}
                  className="w-100 h-100 object-fit-cover position-absolute top-0 start-0"
                  style={{ objectFit: 'cover' }}
                />
                <div 
                  className="position-absolute bottom-0 start-0 end-0 p-2 text-white"
                  style={{
                    background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.8))',
                    zIndex: 2
                  }}
                >
                  <small className="fw-bold">{story.name}</small>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}
export default Stories

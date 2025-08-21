import type { IconType } from 'react-icons'
import type { BootstrapVariantType } from './component'
import type { ReactNode } from 'react'

type IdType = string

export type ProfilePanelLink = {
  image: string
  name: string
  link: string
}

export type UserType = {
  id: IdType
  name: string
  avatar: string
  isStory?: boolean
  mutualCount: number
  hasRequested?: boolean
  role: string
  status: 'online' | 'offline'
  lastMessage: string
  lastActivity: Date
}

export type CommentType = {
  id: IdType
  postId: SocialPostType['id']
  socialUserId: UserType['id']
  socialUser?: UserType
  replyTo?: CommentType['id']
  comment: string
  likesCount: number
  image?: string
  createdAt: Date
  children?: CommentType[]
}

export type SocialPostType = {
  id: IdType
  socialUserId: UserType['id']
  image?: string
  socialUser?: UserType
  caption?: string
  createdAt: Date
  likesCount: number
  commentsCount?: number
  liked?: boolean
  comments?: CommentType[]
  photos?: string[]
  isVideo?: boolean
  isSponsored?: boolean
}

export type VideoType = {
  id: IdType
  userId: UserType['id']
  user?: UserType
  title: string
  isVerified?: boolean
  image?: string
  iframe?: string
  time?: string
  views: string
  isVideoPlayer?: boolean
  uploadTime?: Date
}

export type ChatMessageType = {
  id: IdType
  from: UserType
  to: UserType
  message: string
  sentOn: Date
  image?: string
  isRead?: boolean
  isSend?: boolean
}

export type EventType = {
  id: IdType
  title: string
  category: string
  image: string
  label?: string
  date: Date
  type: 'local' | 'this-week' | 'online' | 'friends' | 'following'
  location: string
  attendees: string[]
}

export type GroupType = {
  id: IdType
  image: string
  logo: string
  name: string
  type: 'Public' | 'Private'
  ppd: number
  members: string[]
  memberCount: string
  isJoin?: boolean
}

export type FooterLinksType = {
  title: string
  items: {
    icon?: IconType
    label: string
    url?: string
  }[]
}

export type ConnectionsType = {
  id: IdType
  userId: UserType['id']
  user?: UserType
  role: string
  sharedConnectionAvatars?: string[]
  description: string
}

export type MediaType = {
  id: IdType
  title?: string
  count?: number
  image: string
  likes: number
  comments: number
  time: string
}

export type ScheduleType = {
  id: IdType
  userId: UserType['id']
  date: Date
  description: string
  title: string
  speakerId: UserType['id'][]
  speakers?: (UserType | undefined)[]
  user?: UserType
}

export type BlogType = {
  id: IdType
  image: string
  category: string
  categoryVariant: BootstrapVariantType
  title: string
  description: string
  date: Date
}

export type CelebrationType = {
  id: IdType
  userId: UserType['id']
  user?: UserType
  textAvatar?: {
    variant: BootstrapVariantType
    text: string
  }
  placeholder?: string
  title: ReactNode
  isEvent?: boolean
}

export type NotificationType = {
  id: IdType
  title: string
  description?: ReactNode
  avatar?: string
  textAvatar?: {
    text: string
    variant: BootstrapVariantType
  }
  time: Date
  isFriendRequest?: boolean
  isRead?: boolean
  inviterId?: string // ID of the user who sent the friend request
  inviterName?: string // Name of the user who sent the friend request
}

export type PostType = {
  id: IdType
  image?: string
  category: 'for-you' | 'covid' | 'trending' | 'news' | 'sports' | 'entertainment'
  photos?: string[]
  title: string
  likeCount: number
  comments: number
  share: number
  iframe?: string
  isVideo?: boolean
  isPlyer?: boolean
}

import Preloader from '@/components/Preloader'
import type { ChildrenType } from '@/types/component'
import { Suspense } from 'react'

const OtherLayout = ({ children }: ChildrenType) => {
  return (
    <Suspense fallback={<Preloader />}>{children}</Suspense>
  )
}

export default OtherLayout

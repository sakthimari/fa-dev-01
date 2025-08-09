import Preloader from "@/components/Preloader"
import type { ChildrenType } from "@/types/component"
import { lazy, Suspense } from "react"
const TopHeader = lazy(() => import("@/components/layout/TopHeader"))

const SocialLayout = ({ children }: ChildrenType) => {
  return (
    <>
      <Suspense>
        <TopHeader />
      </Suspense>

      <Suspense fallback={<Preloader />}>
        {children}
      </Suspense>
    </>
  )
}
export default SocialLayout
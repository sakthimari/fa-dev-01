import { lazy, Suspense, useEffect, useState } from "react"
import { getCurrentUser } from 'aws-amplify/auth'

const TopHeader = lazy(() => import("@/components/layout/TopHeader"))
import GlightBox from '@/components/GlightBox'
import { useFetchData } from '@/hooks/useFetchData'
import { useProfile } from '@/hooks/useProfile'
import { getImageUrl } from '@/utils/imageUtils'
import type { ChildrenType } from '@/types/component'
import clsx from 'clsx'
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  Col,
  Container,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Row,
} from 'react-bootstrap'
import {
  BsBookmark,
  BsBriefcase,
  BsCalendar2Plus,
  BsCalendarDate,
  BsChatLeftText,
  BsEnvelope,
  BsFileEarmarkPdf,
  BsGear,
  BsGeoAlt,
  BsHeart,
  BsLock,
  BsPatchCheckFill,
  BsPencilFill,
  BsPersonX,
  BsThreeDots,
} from 'react-icons/bs'
import { FaPlus } from 'react-icons/fa6'

import { PROFILE_MENU_ITEMS } from '@/assets/data/menu-items'
import { getAllUsers } from '@/helpers/data'

import avatar7 from '@/assets/images/avatar/07.jpg'
import background5 from '@/assets/images/bg/05.jpg'

import album1 from '@/assets/images/albums/01.jpg'
import album2 from '@/assets/images/albums/02.jpg'
import album3 from '@/assets/images/albums/03.jpg'
import album4 from '@/assets/images/albums/04.jpg'
import album5 from '@/assets/images/albums/05.jpg'
import { experienceData } from "@/assets/data/layout"
import { Link, useLocation } from "react-router-dom"
import FallbackLoading from "@/components/FallbackLoading"
import Preloader from "@/components/Preloader"

const Experience = () => {
  return (
    <Card>
      <CardHeader className="d-flex justify-content-between border-0">
        <h5 className="card-title">Experience</h5>
        <Button variant="primary-soft" size="sm">
          
          <FaPlus />
        </Button>
      </CardHeader>
      <CardBody className="position-relative pt-0">
        {experienceData.map((experience, idx) => (
          <div className="d-flex" key={idx}>
            <div className="avatar me-3">
              <span role="button">
                
                <img className="avatar-img rounded-circle" src={experience.logo} alt="" />
              </span>
            </div>
            <div>
              <h6 className="card-title mb-0">
                <Link to=""> {experience.title} </Link>
              </h6>
              <p className="small">
                {experience.description}
                <Link className="btn btn-primary-soft btn-xs ms-2" to="">
                  Edit
                </Link>
              </p>
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  )
}

const Photos = () => {
  return (
    <Card>
      <CardHeader className="d-sm-flex justify-content-between border-0">
        <CardTitle>Photos</CardTitle>
        <Button variant="primary-soft" size="sm">
          
          See all photo
        </Button>
      </CardHeader>
      <CardBody className="position-relative pt-0">
        <Row className="g-2">
          <Col xs={6}>
            <GlightBox href={album1} data-gallery="image-popup">
              <img className="rounded img-fluid" src={album1} alt="album-image" />
            </GlightBox>
          </Col>
          <Col xs={6}>
            <GlightBox href={album2} data-gallery="image-popup">
              <img className="rounded img-fluid" src={album2} alt="album-image" />
            </GlightBox>
          </Col>
          <Col xs={4}>
            <GlightBox href={album3} data-gallery="image-popup">
              <img className="rounded img-fluid" src={album3} alt="album-image" />
            </GlightBox>
          </Col>
          <Col xs={4}>
            <GlightBox href={album4} data-gallery="image-popup">
              <img className="rounded img-fluid" src={album4} alt="album-image" />
            </GlightBox>
          </Col>
          <Col xs={4}>
            <GlightBox href={album5} data-gallery="image-popup">
              <img className="rounded img-fluid" src={album5} alt="album-image" />
            </GlightBox>
          </Col>
        </Row>
      </CardBody>
    </Card>
  )
}

const Friends = () => {
  const allFriends = useFetchData(getAllUsers)

  return (
    <Card>
      <CardHeader className="d-sm-flex justify-content-between align-items-center border-0">
        <CardTitle>
          Friends <span className="badge bg-danger bg-opacity-10 text-danger">230</span>
        </CardTitle>
        <Button variant="primary-soft" size="sm">
          
          See all friends
        </Button>
      </CardHeader>
      <CardBody className="position-relative pt-0">
        <Row className="g-3">
          {allFriends?.slice(0, 4).map((friend, idx) => (
            <Col xs={6} key={idx}>
              <Card className="shadow-none text-center h-100">
                <CardBody className="p-2 pb-0">
                  <div className={clsx('avatar avatar-xl', { 'avatar-story': friend.isStory })}>
                    <span role="button">
                      <img className="avatar-img rounded-circle" src={friend.avatar} alt="" />
                    </span>
                  </div>
                  <h6 className="card-title mb-1 mt-3">
                    
                    <Link to=""> {friend.name} </Link>
                  </h6>
                  <p className="mb-0 small lh-sm">{friend.mutualCount} mutual connections</p>
                </CardBody>
                <div className="card-footer p-2 border-0">
                  <button className="btn btn-sm btn-primary me-1" data-bs-toggle="tooltip" data-bs-placement="top" title="Send message">
                    
                    <BsChatLeftText />
                  </button>
                  <button className="btn btn-sm btn-danger" data-bs-toggle="tooltip" data-bs-placement="top" title="Remove friend">
                    
                    <BsPersonX />
                  </button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </CardBody>
    </Card>
  )
}


const ProfileLayout = ({ children }: ChildrenType) => {
  const { pathname } = useLocation()
  const { profile, refreshProfile } = useProfile()
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null)
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)

  // Refresh profile data when ProfileLayout mounts to ensure latest data
  useEffect(() => {
    refreshProfile()
  }, [refreshProfile])

  // Format join date for display
  const formatJoinDate = (joinDate: string | undefined) => {
    if (!joinDate) return 'Joined recently'
    
    try {
      const date = new Date(joinDate)
      return `Joined on ${date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })}`
    } catch (error) {
      return 'Joined recently'
    }
  }

  // Load image URLs when profile data changes
  useEffect(() => {
    const loadImageUrls = async () => {
      console.log('Loading image URLs...', { 
        profilePhotoKey: profile?.profilePhotoKey, 
        coverPhotoKey: profile?.coverPhotoKey 
      })
      
      if (profile?.profilePhotoKey) {
        const profileUrl = await getImageUrl(profile.profilePhotoKey)
        console.log('Profile image URL:', profileUrl)
        setProfileImageUrl(profileUrl)
      }
      if (profile?.coverPhotoKey) {
        const coverUrl = await getImageUrl(profile.coverPhotoKey)
        console.log('Cover image URL:', coverUrl)
        setCoverImageUrl(coverUrl)
      }
    }
    
    loadImageUrls()
  }, [profile?.profilePhotoKey, profile?.coverPhotoKey])

  return (
    <>
      <Suspense fallback={<Preloader/>}>
        <TopHeader />
      </Suspense>

      <main>
        <Container>
          <Row className="g-4">
            <Col lg={8} className="vstack gap-4">
              <Card>
                <div
                  className="h-200px rounded-top"
                  style={{
                    backgroundImage: `url(${coverImageUrl || background5})`,
                    backgroundPosition: 'center',
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat',
                  }}
                />
                <CardBody className="py-0">
                  <div className="d-sm-flex align-items-start text-center text-sm-start">
                    <div>
                      <div className="avatar avatar-xxl mt-n5 mb-3">
                        <img 
                          className="avatar-img rounded-circle border border-white border-3" 
                          src={profileImageUrl || avatar7} 
                          alt="avatar" 
                        />
                      </div>
                    </div>
                    <div className="ms-sm-4 mt-sm-3">
                      <h1 className="mb-0 h5">
                        {profile?.firstName && profile?.lastName 
                          ? `${profile.firstName} ${profile.lastName}` 
                          : profile?.firstName || 'User'
                        } <BsPatchCheckFill className="text-success small" />
                      </h1>
                      <p>{profile?.email || '250 connections'}</p>
                    </div>
                    <div className="d-flex mt-3 justify-content-center ms-sm-auto">
                      <Button 
                        variant="danger-soft" 
                        className="me-2" 
                        type="button"
                        as={Link}
                        to="/profile/edit"
                      >
                        
                        <BsPencilFill size={19} className="pe-1" /> Edit profile
                      </Button>
                      <Dropdown>
                        <DropdownToggle
                          as="a"
                          className="icon-md btn btn-light content-none"
                          type="button"
                          id="profileAction2"
                          data-bs-toggle="dropdown"
                          aria-expanded="false">
                          <span>
                            
                            <BsThreeDots />
                          </span>
                        </DropdownToggle>
                        <DropdownMenu className="dropdown-menu-end" aria-labelledby="profileAction2">
                          <li>
                            <DropdownItem>
                              
                              <BsBookmark size={22} className="fa-fw pe-2" />
                              Share profile in a message
                            </DropdownItem>
                          </li>
                          <li>
                            <DropdownItem>
                              
                              <BsFileEarmarkPdf size={22} className="fa-fw pe-2" />
                              Save your profile to PDF
                            </DropdownItem>
                          </li>
                          <li>
                            <DropdownItem>
                              
                              <BsLock size={22} className="fa-fw pe-2" />
                              Lock profile
                            </DropdownItem>
                          </li>
                          <li>
                            <hr className="dropdown-divider" />
                          </li>
                          <li>
                            <DropdownItem>
                              
                              <BsGear size={22} className="fa-fw pe-2" />
                              Profile settings
                            </DropdownItem>
                          </li>
                        </DropdownMenu>
                      </Dropdown>
                    </div>
                  </div>
                  <ul className="list-inline mb-0 text-center text-sm-start mt-3 mt-sm-0">
                    {profile?.profession && (
                      <li className="list-inline-item">
                        <BsBriefcase className="me-1" /> {profile.profession}
                      </li>
                    )}
                    {profile?.location && (
                      <li className="list-inline-item">
                        <BsGeoAlt className="me-1" /> {profile.location}
                      </li>
                    )}
                    <li className="list-inline-item">
                      <BsCalendar2Plus className="me-1" /> {formatJoinDate(profile?.joinDate)}
                    </li>
                  </ul>
                </CardBody>
                <CardFooter className="card-footer mt-3 pt-2 pb-0">
                  <ul className="nav nav-bottom-line align-items-center justify-content-center justify-content-md-start mb-0 border-0">
                    {PROFILE_MENU_ITEMS.map((item, idx) => (
                      <li className="nav-item" key={idx}>
                        
                        <Link className={clsx('nav-link', { active: pathname === item.url })} to={item.url ?? ''}>
                          
                          {item.label} {item.badge && <span className="badge bg-success bg-opacity-10 text-success small"> {item.badge.text}</span>}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardFooter>
              </Card>
              <Suspense fallback={<FallbackLoading/>}> {children}</Suspense>
            </Col>
            <Col lg={4}>
              <Row className="g-4">
                <Col md={6} lg={12}>
                  <Card>
                    <CardHeader className="border-0 pb-0">
                      <CardTitle>About</CardTitle>
                    </CardHeader>
                    <CardBody className="position-relative pt-0">
                      <p>{profile?.bio || "He moonlights difficult engrossed it, sportsmen. Interested has all Devonshire difficulty gay assistance joy."}</p>
                      <ul className="list-unstyled mt-3 mb-0">
                        {profile?.birthday && (
                          <li className="mb-2">
                            
                            <BsCalendarDate size={18} className="fa-fw pe-1" /> Born: <strong> {profile.birthday} </strong>
                            <Link className="btn btn-primary-soft btn-xs ms-2" to="/profile/edit">
                              Edit
                            </Link>
                          </li>
                        )}
                        {profile?.gender && (
                          <li className="mb-2">
                            
                            <BsHeart size={18} className="fa-fw pe-1" /> Gender: <strong> {profile.gender} </strong>
                            <Link className="btn btn-primary-soft btn-xs ms-2" to="/profile/edit">
                              Edit
                            </Link>
                          </li>
                        )}
                        {profile?.email && (
                          <li className="mb-2">
                            
                            <BsEnvelope size={18} className="fa-fw pe-1" /> Email: <strong> {profile.email} </strong>
                            <Link className="btn btn-primary-soft btn-xs ms-2" to="/profile/edit">
                              Edit
                            </Link>
                          </li>
                        )}
                        {profile?.joinDate && (
                          <li>
                            
                            <BsCalendar2Plus size={18} className="fa-fw pe-1" /> {formatJoinDate(profile.joinDate)}
                          </li>
                        )}
                      </ul>
                    </CardBody>
                  </Card>
                </Col>
                <Col md={6} lg={12}>
                  <Experience />
                </Col>
                <Col md={6} lg={12}>
                  <Photos />
                </Col>
                <Col md={6} lg={12}>
                  <Friends />
                </Col>
              </Row>
            </Col>
          </Row>
        </Container>
      </main>
    </>
  )
}
export default ProfileLayout
import { Button, Card, CardBody, CardHeader, CardTitle, Col, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Row } from 'react-bootstrap'
import { interestsData } from './data'
import { useEffect } from 'react'

import PageMetaData from '@/components/PageMetaData'
import { useProfile } from '@/hooks/useProfile'
import { BsBriefcase, BsCalendarDate, BsEnvelope, BsGeoAlt, BsHeart, BsPencilSquare, BsPlusCircleDotted, BsThreeDots, BsTrash } from 'react-icons/bs'
import { Link } from 'react-router-dom'

const Interests = () => {
  return (
    <Card>
      <CardHeader className="d-sm-flex justify-content-between border-0 pb-0">
        <CardTitle>Interests</CardTitle>
        <Button variant="primary-soft" size="sm">
          
          See all
        </Button>
      </CardHeader>
      <CardBody>
        <Row className="g-4">
          {interestsData.map((item, idx) => (
            <Col sm={6} lg={4} key={idx}>
              <div className="d-flex align-items-center position-relative">
                <div className="avatar">
                  <img className="avatar-img" src={item.image} alt="image" />
                </div>
                <div className="ms-2">
                  <h6 className="mb-0">
                    
                    <Link className="stretched-link" to="">
                      {item.name}
                    </Link>
                  </h6>
                  <p className="small mb-0">{item.description}</p>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </CardBody>
    </Card>
  )
}

const ActionDropdown = () => {
  return (
    <Dropdown className="ms-auto">
      <DropdownToggle
        as="a"
        className="nav nav-link text-secondary mb-0"
        role="button"
        id="aboutAction"
        data-bs-toggle="dropdown"
        aria-expanded="false">
        <BsThreeDots />
      </DropdownToggle>
      <DropdownMenu className="dropdown-menu-end" aria-labelledby="aboutAction">
        <li>
          <DropdownItem>
            
            <BsPencilSquare size={22} className="fa-fw pe-2" />
            Edit
          </DropdownItem>
        </li>
        <li>
          <DropdownItem>
            
            <BsTrash size={22} className="fa-fw pe-2" />
            Delete
          </DropdownItem>
        </li>
      </DropdownMenu>
    </Dropdown>
  )
}

const About = () => {
  const { profile, refreshProfile } = useProfile()

  // Refresh profile data when About page mounts
  useEffect(() => {
    console.log('About page: refreshing profile data')
    refreshProfile()
  }, [refreshProfile])

  // Log profile data when it changes
  useEffect(() => {
    console.log('About page: profile data updated:', profile)
  }, [profile])

  return (
    <>
    <PageMetaData title='About'/>
      <Card>
        <CardHeader className="border-0 pb-0">
          <CardTitle> Profile Info</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="rounded border px-3 py-2 mb-3">
            <div className="d-flex align-items-center justify-content-between">
              <h6>Overview</h6>
              <ActionDropdown />
            </div>
            <p>
              {profile?.bio || "He moonlights difficult engrossed it, sportsmen. Interested has all Devonshire difficulty gay assistance joy. Handsome met debating sir dwelling age material. As style lived he worse dried. Offered related so visitors we private removed. Moderate do subjects to distance."}
            </p>
          </div>
          <Row className="g-4">
            <Col sm={6}>
              <div className="d-flex align-items-center rounded border px-3 py-2">
                <p className="mb-0">
                  <BsCalendarDate className="fa-fw me-2" /> Born: <strong> {profile?.birthday || "October 20, 1990"} </strong>
                </p>
                <ActionDropdown />
              </div>
            </Col>
            <Col sm={6}>
              <div className="d-flex align-items-center rounded border px-3 py-2">
                <p className="mb-0">
                  <BsHeart className="fa-fw me-2" /> Status: <strong> {profile?.gender || "Single"} </strong>
                </p>
                <ActionDropdown />
              </div>
            </Col>
            <Col sm={6}>
              <div className="d-flex align-items-center rounded border px-3 py-2">
                <p className="mb-0">
                  <BsBriefcase className="fa-fw me-2" /> <strong> {profile?.profession || "Lead Developer"} </strong>
                </p>
                <ActionDropdown />
              </div>
            </Col>
            <Col sm={6}>
              <div className="d-flex align-items-center rounded border px-3 py-2">
                <p className="mb-0">
                  <BsGeoAlt className="fa-fw me-2" /> Lives in: <strong> {profile?.location || "New Hampshire"} </strong>
                </p>
                <ActionDropdown />
              </div>
            </Col>
            <Col sm={6}>
              <div className="d-flex align-items-center rounded border px-3 py-2">
                <p className="mb-0">
                  <BsEnvelope className="fa-fw me-2" /> Email: <strong> {profile?.email || "user@example.com"} </strong>
                </p>
                <ActionDropdown />
              </div>
            </Col>
            <Col sm={6}>
              <div className="d-flex align-items-center rounded border px-3 py-2">
                <p className="mb-0">
                  <BsEnvelope className="fa-fw me-2" /> Email: <strong> {profile?.email || "user@example.com"} </strong>
                </p>
                <ActionDropdown />
              </div>
            </Col>
            {profile?.company && (
              <Col sm={6}>
                <div className="d-flex align-items-center rounded border px-3 py-2">
                  <p className="mb-0">
                    <BsBriefcase className="fa-fw me-2" /> Company: <strong> {profile.company} </strong>
                  </p>
                  <ActionDropdown />
                </div>
              </Col>
            )}
            {profile?.website && (
              <Col sm={6}>
                <div className="d-flex align-items-center rounded border px-3 py-2">
                  <p className="mb-0">
                    <BsGeoAlt className="fa-fw me-2" /> Website: <strong> 
                      <Link to={profile.website} target="_blank"> {profile.website} </Link>
                    </strong>
                  </p>
                  <ActionDropdown />
                </div>
              </Col>
            )}
            {profile?.phone && (
              <Col sm={6}>
                <div className="d-flex align-items-center rounded border px-3 py-2">
                  <p className="mb-0">
                    <BsEnvelope className="fa-fw me-2" /> Phone: <strong> {profile.phone} </strong>
                  </p>
                  <ActionDropdown />
                </div>
              </Col>
            )}
            {profile?.joinDate && (
              <Col sm={6}>
                <div className="d-flex align-items-center rounded border px-3 py-2">
                  <p className="mb-0">
                    <BsCalendarDate className="fa-fw me-2" /> Joined: <strong> 
                      {new Date(profile.joinDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </strong>
                  </p>
                  <ActionDropdown />
                </div>
              </Col>
            )}
            <Col sm={6} className="position-relative">
              <Link className="btn btn-dashed rounded w-100 icons-center justify-content-center" to="">
                
                <BsPlusCircleDotted className="me-1" />
                Add a workplace
              </Link>
            </Col>
            <Col sm={6} className="position-relative">
              <Link className="btn btn-dashed rounded w-100 icons-center justify-content-center" to="">
                
                <BsPlusCircleDotted className="me-1" />
                Add a education
              </Link>
            </Col>
          </Row>
        </CardBody>
      </Card>
      <Interests />
    </>
  )
}
export default About

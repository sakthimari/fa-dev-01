import type { ChildrenType } from '@/types/component'
import { Container, Row, Col } from 'react-bootstrap'
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaGithub } from 'react-icons/fa'
import { Link } from 'react-router-dom'

const ModernAuthLayout = ({ children }: ChildrenType) => {
  return (
    <div className="min-vh-100 d-flex align-items-center bg-light position-relative overflow-hidden modern-auth-container">
      {/* Animated Background Elements */}
      <div className="position-absolute w-100 h-100">
        <div 
          className="position-absolute rounded-circle bg-primary opacity-10 floating-element"
          style={{
            width: '300px',
            height: '300px',
            top: '-150px',
            right: '-150px'
          }}
        />
        <div 
          className="position-absolute rounded-circle bg-info opacity-10 floating-element-2"
          style={{
            width: '200px',
            height: '200px',
            bottom: '-100px',
            left: '-100px'
          }}
        />
        <div 
          className="position-absolute rounded-circle bg-warning opacity-10 floating-element-3"
          style={{
            width: '150px',
            height: '150px',
            top: '20%',
            left: '10%'
          }}
        />
      </div>

      <Container className="position-relative z-index-3">
        <Row className="justify-content-center">
          <Col lg={10} xl={8}>
            <Row className="g-0 rounded-4 overflow-hidden shadow-lg modern-auth-card">
              {/* Left Panel - Branding/Info */}
              <Col lg={6} className="d-none d-lg-block position-relative">
                <div className="h-100 d-flex flex-column justify-content-center p-4 bg-gradient" 
                     style={{
                       background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                       minHeight: '500px'
                     }}>
                  <div className="text-white">
                    <div className="mb-4">
                      <h2 className="display-6 fw-bold mb-3">Welcome to Connect Plus</h2>
                      <p className="lead opacity-90 mb-4">
                        Connect with friends, share your moments, and build meaningful relationships in our vibrant community.
                      </p>
                    </div>
                    
                    <div className="mb-4">
                      <div className="d-flex align-items-center mb-3">
                        <div className="bg-white bg-opacity-20 rounded-circle p-2 me-3">
                          <i className="fas fa-users text-white"></i>
                        </div>
                        <span>Join thousands of active users</span>
                      </div>
                      <div className="d-flex align-items-center mb-3">
                        <div className="bg-white bg-opacity-20 rounded-circle p-2 me-3">
                          <i className="fas fa-shield-alt text-white"></i>
                        </div>
                        <span>Secure and private platform</span>
                      </div>
                      <div className="d-flex align-items-center">
                        <div className="bg-white bg-opacity-20 rounded-circle p-2 me-3">
                          <i className="fas fa-mobile-alt text-white"></i>
                        </div>
                        <span>Access anywhere, anytime</span>
                      </div>
                    </div>

                    <div className="mt-5">
                      <p className="small opacity-75 mb-3">Follow us on social media</p>
                      <div className="d-flex gap-3">
                        <Link to="#" className="text-white opacity-75 hover-opacity-100 transition-all">
                          <FaFacebookF size={20} />
                        </Link>
                        <Link to="#" className="text-white opacity-75 hover-opacity-100 transition-all">
                          <FaTwitter size={20} />
                        </Link>
                        <Link to="#" className="text-white opacity-75 hover-opacity-100 transition-all">
                          <FaLinkedinIn size={20} />
                        </Link>
                        <Link to="#" className="text-white opacity-75 hover-opacity-100 transition-all">
                          <FaGithub size={20} />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Decorative Elements */}
                  <div className="position-absolute top-0 end-0 p-4 opacity-20">
                    <div className="rounded-circle bg-white" style={{ width: '100px', height: '100px' }} />
                  </div>
                  <div className="position-absolute bottom-0 start-0 p-4 opacity-10">
                    <div className="rounded-circle bg-white" style={{ width: '60px', height: '60px' }} />
                  </div>
                </div>
              </Col>

              {/* Right Panel - Auth Form */}
              <Col lg={6}>
                <div className="p-4 d-flex flex-column justify-content-center" style={{ minHeight: '500px' }}>
                  {children}
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
    </div>
  )
}

export default ModernAuthLayout

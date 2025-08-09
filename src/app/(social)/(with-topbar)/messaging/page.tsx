import { Card, Col, Container, Row } from 'react-bootstrap'
import ChatArea from './components/ChatArea'
import ChatToggler from './components/ChatToggler'
import ChatUserList from './components/ChatUserList'
import MessageToast from './components/MessageToast'
import PageMetaData from '@/components/PageMetaData'

const Messaging = () => {
  return (
    <>
    <PageMetaData title='Messaging'/>
    <main>
      <Container>
        <Row className="gx-0">
          <Col lg={4} xxl={3}>
            <div className="d-flex align-items-center mb-4 d-lg-none">
              <ChatToggler />
            </div>
            <Card className="card-body border-end-0 border-bottom-0 rounded-bottom-0">
              <div className=" d-flex justify-content-between align-items-center">
                <h1 className="h5 mb-0">
                  Active chats <span className="badge bg-success bg-opacity-10 text-success">6</span>
                </h1>

                <MessageToast />
              </div>
            </Card>
            <nav className="navbar navbar-light navbar-expand-lg mx-0">
              <ChatUserList />
            </nav>
          </Col>
          <Col lg={8} xxl={9}>
            <ChatArea />
          </Col>
        </Row>
      </Container>
    </main>
    </>
  )
}
export default Messaging

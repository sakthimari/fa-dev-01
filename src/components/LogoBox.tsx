
import { Link } from 'react-router-dom'
import logo from '@/assets/images/logo.svg'

const LogoBox = () => {
  return (
    <Link className="navbar-brand" to="/">
        <img src={logo} alt="logo" height={36} width={36} className="navbar-brand-item" />
    </Link>
  )
}

export default LogoBox

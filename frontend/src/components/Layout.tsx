import { AppBar, Toolbar, Typography, Button, Container, Box } from '@mui/material'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { logout } from '../api/http'

export default function Layout() {
  const navigate = useNavigate()

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Tu Credito Backoffice
          </Typography>
          <Button color="inherit" component={Link} to="/clients">
            Clients
          </Button>
          <Button color="inherit" component={Link} to="/credits">
            Credits
          </Button>
          <Button color="inherit" component={Link} to="/banks">
            Banks
          </Button>
          <Button
            color="inherit"
            onClick={() => {
              logout()
              navigate('/login')
            }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 3, mb: 6 }}>
        <Outlet />
      </Container>
    </Box>
  )
}

import './App.css';
import {
  Paper, FormControl, InputLabel, Select, Badge,
  MenuItem, Grid, Container, TextField, IconButton
} from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles';
import { useEffect, useState } from 'react'
import { bms_getCities, bms_getShows } from './_http_apis/bookmyshowapi'
import ShowCard from './_components/ShowCard'
import ShoppingCartIcon from '@material-ui/icons/ShoppingCart';
import LockIcon from '@material-ui/icons/Lock';
import ShoppingModal from './_components/ShoppingModal'
import { withAuthenticator } from '@aws-amplify/ui-react'

import { Auth } from 'aws-amplify';

async function signOut() {
  try {
    await Auth.signOut();
    window.location.reload()
  } catch (error) {
    console.log('error signing out: ', error);
  }
}

const debounce = (callback, wait) => {
  let timeoutId = null;
  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      callback.apply(null, args);
    }, wait);
  };
}

const StyledBadge = withStyles((theme) => ({
  badge: {
    right: -3,
    top: 13,
    border: `2px solid ${theme.palette.background.paper}`,
    padding: '0 4px',
  },
}))(Badge);

function App() {

  //? APIs
  const [logoUrl] = useState('https://bookmyshow-public.s3.amazonaws.com/bookmyshow_logo.jpg')

  //* Catalogos
  const [catalogoCiudades, setCatalogoCiudades] = useState([])
  const [catalogoShows, setCatalogoShows] = useState([])

  //* Filtro catalogo shows
  const [filtroCatalogoShows, setFiltroCatalogoShows] = useState([])

  //* Valores seleccionados
  const [selectedCiudad, setSelectedCiudad] = useState('Monterrey')

  //* Lista reservaciones
  const [listaReservaciones, setListaReservaciones] = useState([])

  //* Modal
  const [mostrarModal, setMostrarModal] = useState(false)

  //* Funciones
  const pushReservacion = (reservacion) => setListaReservaciones([...listaReservaciones, reservacion])

  const filtrarCatalogoShows = (e) => {
    const filtro = e.target.value
    const shows = catalogoShows.filter(x => x?.movie?.title.toLowerCase().includes(filtro))
    setFiltroCatalogoShows(shows)
  }

  const filtrarCatalogoShowsDebounced = debounce(filtrarCatalogoShows, 450)

  //* Cargar datos iniciales
  useEffect(() => {
    const fetchAPIs = async () => {
      try {
        const cargarCatalogosResponse = await Promise.all([
          bms_getShows(selectedCiudad),
          bms_getCities()
        ])

        const [showsResponse, citiesResponse] = cargarCatalogosResponse
        setCatalogoShows(showsResponse.shows)
        setFiltroCatalogoShows(showsResponse.shows)
        setCatalogoCiudades(citiesResponse.cities)
      }
      catch (e) {
        console.log('fetchAPIs | error', e)
      }
    }
    fetchAPIs()
  }, [selectedCiudad])


  return (
    <>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
      <ShoppingModal open={mostrarModal} setMostrarModal={setMostrarModal} listaReservaciones={listaReservaciones} />
      <Container>
        <Grid item xs={12}>
          <Paper elevation={3} className="bms_search">
            <img src={logoUrl} className="bms_search__logo" />
            <TextField label="Busca películas y eventos" className="bms_search__input" onKeyUp={filtrarCatalogoShowsDebounced} />
            <FormControl className="bms_search__select">
              <InputLabel id="demo-simple-select-label">Ciudades</InputLabel>
              <Select
                value={selectedCiudad}
                onChange={(e) => setSelectedCiudad(e.target.value)}
              >
                {
                  catalogoCiudades.map((x, indx) => <MenuItem key={indx} value={x}>{x}</MenuItem>)
                }
              </Select>
            </FormControl>
            <IconButton aria-label="cart" onClick={() => setMostrarModal(true)}>
              <StyledBadge badgeContent={listaReservaciones.length} color="secondary">
                <ShoppingCartIcon />
              </StyledBadge>
            </IconButton>
            <IconButton aria-label="cart" onClick={() => signOut()}>
              <StyledBadge color="secondary">
                <LockIcon />
              </StyledBadge>
            </IconButton>
          </Paper>
        </Grid>
        <Grid item xs={12} className="bms_shows__container">
          {
            filtroCatalogoShows.map((x, indx) => <ShowCard data={x} defaultPosterUrl={logoUrl} pushReservacion={pushReservacion} />)
          }
        </Grid>
      </Container>
    </>
  );
}

// https://pandeysoni.medium.com/how-to-setup-customize-amplify-authentication-ui-using-hooks-36442f5fdc
// export default App
export default withAuthenticator(App, {
  usernameAttributes: 'email',
  signupConfig: {
    hiddenDefaults: ['phone_number'],
    signUpFields: [{ key: 'name', label: 'Nombre', required: true }]
  }
});

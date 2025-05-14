import AppLogo from "../../assets/AppLogo.png";
import {useState} from "react";
import {Link, useNavigate} from 'react-router-dom';
import {AppTexts} from "../../utils/AppTexts.jsx";
import {useTitleWithAppName} from "../../hooks/commonHooks/useTitle.jsx";
import {useAuth} from "../../contexts/AuthContext.jsx";
import {loginUser} from "../../serviceApiCalls/UserApiService.jsx";

function Login() {
    useTitleWithAppName('Login');
    const [error, setError] = useState('');
    const { setAuthToken } = useAuth();
    const navigate = useNavigate();

    const[user, setUser] = useState({
        username: "",
        password: "",
    });

    const handleSubmit = (event) => {
        event.preventDefault();
        setError('')

        if (!user.username || !user.password) {
            setError('Falta el nombre de usuario o la contraseña');
            return;
        }

        loginUser(user.username, user.password).then((response) => {
            if (!response.ok) {
                setError('Las credenciales introducidas no son válidas.');
                return;
            }

            setAuthToken(response.respuesta.accessToken);
            navigate('/');
        });
    };

    const handleChange = (event) => {
        setUser({...user, [event.target.name]: event.target.value});
    };

    return (
        <div className="text-center mt-5">
            <div className="d-flex flex-column align-items-center">
                <img src={AppLogo} alt="Logo" width="115px" height="100px" />
                <span className="titleFormat mt-3" style={{ fontSize: '3.5rem' }}>¡Hola!</span>
                <span className="titleFormat mt-3" style={{ fontSize: '1.5rem' }}>
                    Inicia sesión para
                    <br/>
                    acceder a {AppTexts.appName}
                </span>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="d-flex flex-column gap-3 mt-4 mx-auto" style={{width:'300px'}}>
                    <input className="appInput mt-3 p-2 ps-2" type="text" name="username" onChange={handleChange}
                           value={user.username} placeholder="username" />
                    <input className="appInput mt-3 p-2 ps-2" type="password" name="password" onChange={handleChange}
                           value={user.password} placeholder="contraseña" />
                    {error && <span className="alert alert-danger p-1 mb-1 mt-1" style={{ fontSize: '0.8rem'}}>{error}</span>}
                    <button type="submit" className={error ? "btn-login" : "mt-4 btn-login"}>Acceder</button>
                </div>
            </form>
            <div className="mt-4 mb-4" style={{fontSize:'0.9rem'}}>
                <span>¿No estás registrado? </span>
                <Link to="/register">Regístrate aquí</Link>
            </div>
        </div>
    )
}

export default Login;
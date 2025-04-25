import {useTitleWithAppName} from "../../hooks/commonHooks/useTitle.jsx";
import {useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {registerUser} from "../../serviceApiCalls/UserApiService.jsx";
import {useAuth} from "../../contexts/AuthContext.jsx";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

function NewUser() {
    useTitleWithAppName("Registro");
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { setAuthToken } = useAuth();
    const navigate = useNavigate();

    const[userData, setUserData] = useState({
        username: "",
        email: "",
        password: "",
        passwordConfirmation: "",
    });

    const togglePassword = () => {
        setShowPassword((prev) => !prev);
    };

    const toggleConfirmPassword = () => {
        setShowConfirmPassword((prev) => !prev);
    }


    const handleChange = (event) => {
        setUserData({...userData, [event.target.name]: event.target.value});
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        setError('');

        if (!userData.username || !userData.password || !userData.password || !userData.passwordConfirmation) {
            setError('Falta alguno de los datos de registro.');
            return;
        }

        if (userData.username.length < 5) {
            setError('La nombre de usuario debe tener, al menos, 5 caracteres');
            return;
        }

        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(userData.username)) {
            setError('El nombre de usuario solo puede contener letras, números y guiones bajos (_)');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.email)) {
            setError('El correo electrónico no tiene un formato válido.');
            return;
        }

        if (userData.password.length < 5) {
            setError('La contraseña debe tener, como mínimo, 5 caracteres');
            return;
        }

        if (/\s/.test(userData.password)) {
            setError('La contraseña no debe contener espacios en blanco');
            return;
        }

        if (userData.password.localeCompare(userData.passwordConfirmation) !== 0) {
            setError('La contraseña y su confirmación no coinciden');
            return;
        }

        registerUser(userData.username, userData.email, userData.password).then((response) => {
            if (!response.ok) {
                setError('El nombre de usuario o el correo electrónico ya existen. Elija uno diferente');
                return;
            }

            const token = response.respuesta.accessToken;
            const isValidToken = token && token.split('.').length === 3;

            if (isValidToken) {
                setAuthToken(token);
                navigate('/');
                return;
            }

            setError('Ha fallado el registro y la autenticación');
        });

    };

    return (
        <div className="text-center mt-4">
            <div className="d-flex flex-column align-items-center">
                <span className="titleFormat mt-3" style={{ fontSize: '2rem' }}>¡Regístrate!</span>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="d-flex flex-column gap-3 mt-4 mx-auto" style={{width:'300px'}}>
                    <input className="appInput mt-3 p-2 ps-2" type="text" name="username" onChange={handleChange}
                           value={userData.username} placeholder="username" />
                    <input className="appInput mt-3 p-2 ps-2" type="text" name="email" onChange={handleChange}
                           value={userData.email} placeholder="email" />

                    <div className="position-relative mt-3">
                        <input className="appInput p-2 ps-2 pe-5 w-100" type={showPassword ? 'text' : 'password'}
                               name="password" onChange={handleChange}
                               value={userData.password} placeholder="contraseña" />
                        <button type="button" onClick={togglePassword}
                                style={{top: '50%', right: '10px', transform: 'translateY(-50%)', background: 'none',
                                    border: 'none', padding: 0, cursor: 'pointer'}}
                                className="position-absolute">
                            <FontAwesomeIcon icon={['fas', showPassword ? 'eye' : 'eye-slash']} className="text-secondary"/>
                        </button>
                    </div>
                    <div className="position-relative mt-3">
                        <input className="appInput p-2 ps-2 pe-5 w-100" type={showConfirmPassword ? 'text' : 'password'}
                               name="passwordConfirmation" onChange={handleChange}
                               value={userData.passwordConfirmation} placeholder="confirmar contraseña" />
                        <button type="button" onClick={toggleConfirmPassword}
                                style={{top: '50%', right: '10px', transform: 'translateY(-50%)', background: 'none',
                                    border: 'none', padding: 0, cursor: 'pointer'}}
                                className="position-absolute">
                            <FontAwesomeIcon icon={['fas', showConfirmPassword ? 'eye' : 'eye-slash']} className="text-secondary"/>
                        </button>
                    </div>


                    {error && <span className="alert alert-danger p-1 mb-1 mt-1" style={{ fontSize: '0.8rem'}}>{error}</span>}
                    <button type="submit" className={error ? "btn-login" : "mt-4 btn-login"}>Registrarme</button>
                </div>
            </form>
            <div className="mt-4 mb-4" style={{fontSize:'0.9rem'}}>
                <span>¿Ya estás registrado? </span>
                <Link to="/login">Inicia sesión</Link>
            </div>
        </div>
    )
}

export default NewUser;
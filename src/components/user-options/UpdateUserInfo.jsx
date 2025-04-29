import {useTitleWithAppName} from "../../hooks/commonHooks/useTitle.jsx";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {useEffect, useState} from "react";
import {useAuth} from "../../contexts/AuthContext.jsx";
import {getUser, updateUserData} from "../../serviceApiCalls/UserApiService.jsx";
import Swal from "sweetalert2";
import Loading from "../loading/Loading.jsx";

function UpdateUserInfo() {
    useTitleWithAppName("Edición usuario");
    const { userName } = useAuth();
    const [error, setError] = useState('');
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [modifyPassword, setModifyPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const[userData, setUserData] = useState({
        username: userName,
        email: "",
        oldPassword: "",
        newPassword: "",
        passwordConfirmation: "",
    });

    useEffect(() => {
        if (!userName) return;

        setIsLoading(true);
        getUser(userName)
            .then((response) => {
                setUserData((prevUserData) => ({
                    ...prevUserData,
                    email: response.respuesta.email
                }));
                setIsLoading(false);
            })
            .catch((error) => {
                console.log("Error al obtener el usuario: ", error);
                setIsLoading(false);
            })
    }, [userName]);


    const handleChange = (event) => {
        setUserData({...userData, [event.target.name]: event.target.value});
    };

    const toggleOldPassword = () => {
        setShowOldPassword(!showOldPassword);
    }

    const toggleNewPassword = () => {
        setShowNewPassword(!showNewPassword);
    }

    const toggleConfirmPassword = () => {
        setShowConfirmPassword(!showConfirmPassword);
    }

    const toggleModifyPassword = () => {
        setModifyPassword(prev => {
            const newState = !prev;

            if (!newState) {
                setUserData(prevUserData => ({
                    ...prevUserData,
                    oldPassword: "",
                    newPassword: "",
                    passwordConfirmation: "",
                }));
                setShowOldPassword(false);
                setShowNewPassword(false);
                setShowConfirmPassword(false);
                setError('');
            }

            return newState;
        });
    }

    const handleSubmit = (event) => {
        event.preventDefault();
        setError('');

        if (!userData.email) {
            setError('Falta el correo electrónico');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.email)) {
            setError('El correo electrónico no tiene un formato válido.');
            return;
        }

        if (modifyPassword && (!userData.oldPassword || !userData.newPassword || !userData.passwordConfirmation)) {
            setError('Falta algún campo de contraseñas por rellenarse');
            return;
        }

        if (modifyPassword && userData.newPassword.length < 5) {
            setError('La nueva contraseña debe tener, como mínimo, 5 caracteres');
            return;
        }

        if (modifyPassword && /\s/.test(userData.newPassword)) {
            setError('La nueva contraseña no debe contener espacios en blanco');
            return;
        }

        if (modifyPassword && userData.newPassword !== userData.passwordConfirmation) {
            setError('La nueva contraseña y su confirmación no coinciden');
            return;
        }

        updateUserData(userData.username, userData.email, userData.oldPassword, userData.newPassword).then((response) => {
            if (!response.ok) {
                setError("Alguno de los datos introducidos son incorrectos");
                Swal.fire({
                    icon:"error",
                    title: "Error en el cambio de datos",
                    text: "No se han podido realizar los cambios. Por favor, verifica los datos y vuelve a intentarlo",
                    showConfirmButton: false,
                    timer: 3500,
                    allowOutsideClick: true,
                    customClass: {
                        title: 'swal2-title-sm',
                        popup: 'swal2-popup-sm',
                        htmlContainer: 'swal2-text-sm'
                    }
                })
                return;
            }

            setUserData(prevUserData => ({
                ...prevUserData,
                email: userData.email
            }));

            Swal.fire({
                icon:"success",
                title: 'Datos actualizados',
                text: 'Tus datos se han modificado correctamente',
                showConfirmButton: false,
                timer: 2500,
                allowOutsideClick: true,
                customClass: {
                    title: 'swal2-title-sm',
                    popup: 'swal2-popup-sm',
                    htmlContainer: 'swal2-text-sm'
                }
            });
        })

    };

    return (
        isLoading ? (
                <Loading></Loading>
            ) : (
                <>
                    <div className="subheaderStyle d-flex justify-content-between align-items-center">
                        <div className="ms-2">
                            Modificar datos de usuario
                        </div>
                        <div>
                            <button className="me-3 subheaderButton" onClick={toggleModifyPassword}>
                                <FontAwesomeIcon icon={['fas', modifyPassword ? 'lock' : 'key']} className="me-2 fa-sm"/>
                                {modifyPassword ? 'No modificar contraseña' : 'Modificar contraseña'}
                            </button>
                        </div>
                    </div>
                    <div className="d-flex flex-column align-items-center">
                    <span className="mt-4" style={{fontWeight: "bold", fontSize: "1.2rem"}}>
                        Modifica los datos de tu cuenta
                    </span>
                        <form onSubmit={handleSubmit}>
                            <div className="d-flex flex-column align-items-start" style={{marginTop: "2.1rem"}}>
                                <label>Correo electrónico:</label>
                                <input className="appInput modifyUserInput p-2 ps-2 mt-2" type="text" name="email" onChange={handleChange}
                                       value={userData.email} placeholder="email" />
                            </div>
                            {
                                modifyPassword && (
                                    <>
                                        <div className="d-flex flex-column align-items-start mt-4">
                                            <label>Contraseña actual:</label>
                                            <div className="position-relative mt-2">
                                                <input className="appInput modifyUserInput p-2 ps-2 pe-5" type={showOldPassword ? 'text' : 'password'}
                                                       name="oldPassword" onChange={handleChange}
                                                       value={userData.oldPassword} placeholder="contraseña actual" />
                                                <button type="button" onClick={toggleOldPassword}
                                                        style={{top: '50%', right: '10px', transform: 'translateY(-50%)', background: 'none',
                                                            border: 'none', padding: 0, cursor: 'pointer'}}
                                                        className="position-absolute">
                                                    <FontAwesomeIcon icon={['fas', showOldPassword ? 'eye' : 'eye-slash']} className="text-secondary"/>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="d-flex flex-column align-items-start mt-4">
                                            <label>Nueva contraseña:</label>
                                            <div className="position-relative mt-2">
                                                <input className="appInput modifyUserInput p-2 ps-2 pe-5" type={showNewPassword ? 'text' : 'password'}
                                                       name="newPassword" onChange={handleChange}
                                                       value={userData.newPassword} placeholder="contraseña actual" />
                                                <button type="button" onClick={toggleNewPassword}
                                                        style={{top: '50%', right: '10px', transform: 'translateY(-50%)', background: 'none',
                                                            border: 'none', padding: 0, cursor: 'pointer'}}
                                                        className="position-absolute">
                                                    <FontAwesomeIcon icon={['fas', showNewPassword ? 'eye' : 'eye-slash']} className="text-secondary"/>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="d-flex flex-column align-items-start mt-4">
                                            <label>Repite la nueva contraseña:</label>
                                            <div className="position-relative mt-2">
                                                <input className="appInput modifyUserInput p-2 ps-2 pe-5" type={showConfirmPassword ? 'text' : 'password'}
                                                       name="passwordConfirmation" onChange={handleChange}
                                                       value={userData.passwordConfirmation} placeholder="contraseña actual" />
                                                <button type="button" onClick={toggleConfirmPassword}
                                                        style={{top: '50%', right: '10px', transform: 'translateY(-50%)', background: 'none',
                                                            border: 'none', padding: 0, cursor: 'pointer'}}
                                                        className="position-absolute">
                                                    <FontAwesomeIcon icon={['fas', showConfirmPassword ? 'eye' : 'eye-slash']} className="text-secondary"/>
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )
                            }
                            <div className="d-flex flex-column align-items-center">
                                {error && <span className="alert alert-danger modifyUserInput p-1 mb-1 mt-4" style={{ fontSize: '0.8rem'}}>{error}</span>}
                                <button className={error ? "mt-3 btn-login modifyUserInput" : "mt-5 btn-login modifyUserInput"} type="submit">Modificar datos</button>
                            </div>
                        </form>
                    </div>
                </>
            )
    );
}

export default UpdateUserInfo;
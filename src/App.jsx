import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import AppLogo from "./assets/AppLogo.png";
import { AppTexts } from "./utils/AppTexts.jsx";
import Menu from "./components/home-elements/Menu.jsx";
import Home from "./components/Home.jsx";
import Records from "./components/records/Records.jsx";
import RecordIndividual from "./components/records/RecordIndividual.jsx";
import Budgets from "./components/budgets/Budgets.jsx";
import BudgetIndividual from "./components/budgets/BudgetIndividual.jsx";
import Requests from "./components/requests/Requests.jsx";
import UpdateUserInfo from "./components/user-options/UpdateUserInfo.jsx";
import Login from "./components/no-registered/Login.jsx";
import NewUser from "./components/no-registered/NewUser.jsx";
import Footer from "./components/home-elements/Footer.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from 'react-router-dom';
import {AuthProvider, useAuth} from "./contexts/AuthContext.jsx";
import {useEffect, useRef, useState} from "react";
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {useIsMenuMobile} from "./hooks/responsiveHooks.jsx";


function AppLayout() {
    const { userName } = useAuth();
    const { clearAuthToken } = useAuth();
    const [tooltipActive, setTooltipActive] = useState(false);
    const tooltipRef = useRef(null);
    const buttonRef = useRef(null);
    const navigate = useNavigate();
    const isMenuMobile = useIsMenuMobile();
    const [buttonMenuActive, setButtonMenuActive] = useState(false);
    const mobileMenuRef = useRef(null);
    const mobileMenuButtonRef = useRef(null);

    const changeTooltipStatus = () => setTooltipActive(!tooltipActive);
    const goToModifiedUserInfo = () => {
        setTooltipActive(false);
        navigate('/update-user');
    };

    const goOutApplication = async () => {
        setTooltipActive(false);

        const result = await Swal.fire({
            title: '¿Deseas salir de la aplicación?',
            text: 'Tu sesión se cerrará',
            icon: 'warning',

            showCancelButton: true,
            confirmButtonText: 'Salir',
            cancelButtonText: 'Cancelar',
            reverseButtons: false,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            customClass: {
                title: 'swal2-title-sm',
                popup: 'swal2-popup-sm',
                confirmButton: 'swal2-btn-sm',
                cancelButton: 'swal2-btn-sm',
                htmlContainer: 'swal2-text-sm'
            }
        });

        if (result.isConfirmed) {
            await clearAuthToken();
            navigate('/login');
        }
    };

    const handleClickOutside = (event) => {
        if (
            tooltipRef.current &&
            !tooltipRef.current.contains(event.target) &&
            buttonRef.current &&
            !buttonRef.current.contains(event.target)
        ) {
            setTooltipActive(false);
        }

        if (
            mobileMenuRef.current &&
            !mobileMenuRef.current.contains(event.target) &&
            mobileMenuButtonRef.current &&
            !mobileMenuButtonRef.current.contains(event.target)
        ) {
            setButtonMenuActive(false);
        }

    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (!isMenuMobile) {
            setButtonMenuActive(false);
        }
    }, [isMenuMobile]);

    return (
        <div className="appContainer d-flex flex-column min-vh-100">
            <div className="appHeader p-3 d-flex align-items-center justify-content-between">
                {
                    isMenuMobile && (
                        <>
                            <div className="position-relative" ref={mobileMenuButtonRef}>
                                <div className="mobile-menu-button" onClick={() => setButtonMenuActive(!buttonMenuActive)}>
                                    <FontAwesomeIcon className="fa-lg border-1" icon={['fas', 'bars']} />
                                </div>

                                {buttonMenuActive && (
                                    <div className="mobile-tooltip-menu" ref={mobileMenuRef}>
                                        <div className="tooltip-arrow left" />
                                        <div className="tooltip-content px-2 py-1">
                                            <Link to="/" className="mobile-menu-item" onClick={() => setButtonMenuActive(false)}>
                                                <FontAwesomeIcon icon={['fas', 'home']} className="me-2" />
                                                Inicio
                                            </Link>
                                            <Link to="/records" className="mobile-menu-item mt-1" onClick={() => setButtonMenuActive(false)}>
                                                <FontAwesomeIcon icon={['fas', 'money-bill-wave']} className="me-2" />
                                                Gastos e Ingresos
                                            </Link>
                                            <Link to="/budgets" className="mobile-menu-item mt-1" onClick={() => setButtonMenuActive(false)}>
                                                <FontAwesomeIcon icon={['fas', 'wallet']} className="me-2" />
                                                Presupuestos
                                            </Link>
                                            <Link to="/requests" className="mobile-menu-item mt-1" onClick={() => setButtonMenuActive(false)}>
                                                <FontAwesomeIcon icon={['fas', 'users']} className="me-2" />
                                                Solicitudes
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )
                }
                <Link to="/" className="text-decoration-none text-reset">
                    <div className="d-flex align-items-center justify-content-start">
                        {!isMenuMobile && (
                            <img src={AppLogo} className="appLogoSize" alt="Logo" />
                        )}

                        <span className={`${isMenuMobile ? 'titleFormatSmall' : 'titleFormat ms-3'}`} >{AppTexts.appName}</span>
                    </div>
                </Link>
                <div className="d-flex align-items-center justify-content-end position-relative">
                    <div className={`userNameOptionFormat text-reset align-items-center p-2 ${tooltipActive ? 'userButtonActive' : ''}`}
                         onClick={changeTooltipStatus} ref={buttonRef}>
                        {!isMenuMobile && (
                            <span className="userNameHeaderFormat me-2"> {userName || 'Usuario'}</span>
                        )}
                        <FontAwesomeIcon  className={`fa-${isMenuMobile ? '2xl' : 'xl'}`} icon={['fas', 'circle-user']} style={{ color: '#6C4BA5' }} />
                    </div>
                    {tooltipActive && (
                        <div className="custom-tooltip" ref={tooltipRef}>
                            <div className="tooltip-arrow" />
                            <div className="tooltip-content">
                                <button className="tooltip-button" onClick={goToModifiedUserInfo}>
                                    <FontAwesomeIcon icon={['fas', 'user-pen']} style={{ width: '17px' }}/>
                                    <span className="ms-2">Editar datos de usuario</span>
                                </button>
                                <button className="tooltip-button mt-1" onClick={goOutApplication}>
                                    <FontAwesomeIcon icon={['fas', 'arrow-right-from-bracket']} className="align-items-start" style={{ width: '17px' }}/>
                                    <span className="ms-2">Salir de la aplicación</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="d-flex flex-grow-1">
                {!isMenuMobile && (
                    <Menu />
                )}

                <main className="flex-grow-1 overflow-auto w-100">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/records" element={<Records />} />
                        <Route path="/record" element={<RecordIndividual />} />
                        <Route path="/record/:recordId" element={<RecordIndividual />} />
                        <Route path="/record/budget/:budgetId" element={<RecordIndividual />} />
                        <Route path="/budgets" element={<Budgets />} />
                        <Route path="/budget" element={<BudgetIndividual />} />
                        <Route path="/budget/:budgetId" element={<BudgetIndividual />} />
                        <Route path="/requests" element={<Requests />} />
                        <Route path="/update-user" element={<UpdateUserInfo />} />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </main>
            </div>

            <Footer />
        </div>
    );
}

function NoRegisterLayout() {
    return (
        <div className="appContainer d-flex flex-column min-vh-100">
            <div className="appHeader w-100 p-3 d-flex align-items-center justify-content-center">
                <div className="d-flex align-items-center justify-content-center">
                    <img src={AppLogo} className="appLogoSize" alt="Logo" />
                    <span className="titleFormat ms-3">{AppTexts.appName}</span>
                </div>
            </div>

            <div className="flex-grow-1">
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<NewUser />} />
                    <Route path="*" element={<Navigate to="/login" />} />
                </Routes>
            </div>

            <Footer />
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <AppRouter />
        </AuthProvider>
    );
}

function AppRouter() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) return <div>Cargando...</div>;

    return (
        <Router>
            {isAuthenticated ? <AppLayout /> : <NoRegisterLayout />}
        </Router>
    );
}

export default App;



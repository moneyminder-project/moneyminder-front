import {useTitleWithAppName} from "../../hooks/commonHooks/useTitle.jsx";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import React, {useEffect, useState} from "react";
import {Dropdown} from "react-bootstrap";
import {getBudgets} from "../../serviceApiCalls/BudgetApiService.jsx";
import {formatDate, formatNumber} from "../../utils/Formatters.jsx";
import {useAuth} from "../../contexts/AuthContext.jsx";
import {
    createGroupRequest,
    getRequestsByUsername,
    updateGroupRequest
} from "../../serviceApiCalls/RequestApiService.jsx";
import {useNavigate} from "react-router-dom";
import {getUser} from "../../serviceApiCalls/UserApiService.jsx";
import {errorSwal, successSwal} from "../../utils/SwalUtils.jsx";
import Swal from "sweetalert2";
import Loading from "../loading/Loading.jsx";
import {useIsLineButtonsInTable, useIsMenuMobile, useIsTableMobile} from "../../hooks/responsiveHooks.jsx";

function Requests() {
    useTitleWithAppName("Solicitudes");
    const { userName } = useAuth();
    const navigate = useNavigate();
    const [budgets, setBudgets] = useState([]);
    const [selectedBudget, setSelectedBudget] = useState(null);
    const [requestUsername, setRequestUsername] = useState(null);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [historicRequests, setHistoricRequests] = useState([]);
    const [error, setError] = useState(null);
    const [errorInitialBudgets, setErrorInitialBudgets] = useState(null);
    const [errorInitialRequests, setErrorInitialRequests] = useState(null);
    const [loading, setLoading] = useState(false);
    const isMenuMobile = useIsMenuMobile();
    const isTableMobile = useIsTableMobile();
    const isLineButtonsInTable = useIsLineButtonsInTable();

    useEffect(() => {
        setLoading(true);
        setErrorInitialBudgets(null);
        setErrorInitialRequests(null);

        const fetchData = async () => {
            try {
                const[budgetsResponse, requestsResponse] = await Promise.all([
                    getBudgets(),
                    getRequestsByUsername(userName)
                ]);

                if (budgetsResponse.ok) {
                    setBudgets(budgetsResponse.respuesta || []);
                } else {
                    setErrorInitialBudgets('No se han podido obtener los presupuestos del usuario.')
                    setBudgets([]);
                }

                if (requestsResponse.ok) {
                    const request = requestsResponse.respuesta || [];
                    setPendingRequests(request.filter(req => req.accepted === null));
                    setHistoricRequests(request.filter(req => req.accepted !== null));
                } else {
                    setRequestUsername([]);
                    setErrorInitialRequests('No se han podido obtener las solicitudes del usuario.')
                }

                setLoading(false);

            } catch(error) {
                console.error('Error al obtener los datos iniciales', error);
                setLoading(false);
            }
        }

        fetchData();

    }, []);

    const goToBudget = () => {
        navigate(`/budget`);
    }

    const selectBudget = (budget) => {
        if (selectedBudget?.id === budget.id) {
            setSelectedBudget(null);
        } else {
            setSelectedBudget(budget);
        }
    }

    const makeRequest = (event) => {
        event.preventDefault();
        setError('');

        if (!selectedBudget || !requestUsername?.length) {
            setError('No se ha seleccionado presupuesto o no se ha escrito un nombre de usuario.')
            return;
        }

        if (requestUsername.trim().toLowerCase() === userName.trim().toLowerCase()) {
            setError('No se puede enviar un usuario una solicitud a si mismo');
            errorSwal('Solicitud no válida', 'No puedes enviarte una solicitud a ti mismo');
            return;
        }

        const yaExisteAceptada = historicRequests.some(req =>
            req.budgetName === selectedBudget.name &&
            req.accepted === true &&
            req.requestingUser === userName &&
            req.requestedUser === requestUsername
        );

        if (yaExisteAceptada) {
            setError('Ya existe una solicitud aceptada para este presupuesto y usuario.');
            errorSwal('Solicitud duplicada', 'Ya tienes una solicitud aceptada con este usuario para este presupuesto.');
            return;
        }

        const yaExistePendiente = pendingRequests.some(req =>
            req.budgetName === selectedBudget.name &&
            req.requestingUser === userName &&
            req.requestedUser === requestUsername
        );

        if (yaExistePendiente) {
            setError('Ya existe una solicitud pendiente para este presupuesto y usuario.');
            errorSwal('Solicitud en espera', 'Ya existe una solicitud pendiente con este usuario para este presupuesto.');
            return;
        }

        getUser(requestUsername).then((response) => {
            if (!response.ok) {
                setError('No se ha encontrado un nombre de usuario válido.');
                errorSwal('Usuario no encontrado', 'No se ha encontrado un usuario con ese nombre de usuario.');
            } else {
                createGroupRequest(selectedBudget.groupId, userName, requestUsername).then((response) => {
                    if(!response.ok) {
                        errorSwal('Error al crear la solicitud', 'No se ha podido crear la solicitud')
                    } else {
                        successSwal('Solicitud creada', 'La solicitud se ha creado correctamente.');
                        setPendingRequests(prev => [...prev, response.respuesta]);
                    }
                })
            }
        });
    };

    const updateRequest = async (request, reply) => {

        const result = await Swal.fire({
            title: `¿Desesas ${reply ? 'aceptar' : 'rechazar'} la invitación?`,
            text: `La invitación sera ${reply ? 'aceptará' : 'rechazará'}`,
            icon: 'question',

            showCancelButton: true,
            confirmButtonText: `${reply ? 'Aceptar' : 'Rechazar'}`,
            cancelButtonText: 'Cancelar',
            reverseButtons: false,
            confirmButtonColor: `${reply ? '#198754' : '#d33'}`,
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
            updateGroupRequest(request.id, request.requestingUser, request.requestedUser, reply).then(response => {
                if (!response.ok) {
                    errorSwal('No se ha podido guardar la respuestas', 'No se ha podido guardar la respuesta a la solicitud.');
                } else {
                    successSwal('Se ha guardado la respuesta', 'Se ha guardado la respuesta a la solicitud.')
                    const updatedRequest = { ...request, accepted: reply };

                    setPendingRequests(prev => prev.filter(req => req.id !== request.id));
                    setHistoricRequests(prev => [...prev, updatedRequest]);
                }
            })
        }
    }

    return (
        <>
            <div className="subheaderStyle d-flex justify-content-between align-items-center">
                <div className="ms-2">
                    Solicitudes de presupuestos
                </div>
                <div>
                    <button className="me-3 subheaderButton" onClick={() => goToBudget()} disabled={loading}>
                        <FontAwesomeIcon icon={['fas', 'plus']} className="me-2 fa-sm"/>
                        Crear presupuesto
                    </button>
                </div>
            </div>
            {
                loading ? (
                    <Loading></Loading>
                ) : (
                    <>
                        <div className={`d-flex flex-column align-items-center ${!isMenuMobile && 'mt-4'}`}>
                            {errorInitialRequests && (
                                <span className="alert alert-danger p-1 ps-4 pe-4 mb-1 mt-1 w-95 text-center">
                            <FontAwesomeIcon icon={['fas', 'triangle-exclamation']} className="me-2"/>
                                    {errorInitialRequests}
                        </span>
                            )}
                            {errorInitialBudgets && (
                                <span className="alert alert-danger p-1 ps-4 pe-4 mb-1 mt-1 w-95 text-center">
                            <FontAwesomeIcon icon={['fas', 'triangle-exclamation']} className="me-2"/>
                                    {errorInitialBudgets}
                        </span>
                            )}
                        </div>
                        <div className={`d-flex flex-column align-items-center ${isMenuMobile ? 'mt-3' : (errorInitialRequests || errorInitialBudgets) ? 'mt-3' : 'mt-5'}`}>
                            <div className="appSection d-flex flex-wrap mb-5 p-3">
                        <span className="appTableTitle mt-0 w-100">
                            Nueva solicitud:
                        </span>
                                <form onSubmit={makeRequest} className="w-100">
                                    <div className="d-flex flex-wrap mt-2">
                                        <div className="requestDiv">
                                            <label className="filterLabel">Presupuestos:</label>
                                            {
                                                !budgets?.length ? (
                                                    <input type="text" className="requestInput appInput form-control"
                                                           value={'No tienes presupuestos'} disabled={true}/>
                                                ) : (
                                                    <Dropdown className="requestInput appInput" align="start">
                                                        <Dropdown.Toggle
                                                            as="div" className="dropdownInputToggle d-flex justify-content-between align-items-center"
                                                            style={{ backgroundColor: "white", cursor: "pointer" }} disabled={!budgets.length}>
                                            <span>
                                                {selectedBudget ? selectedBudget.name : 'Seleccionar presupuesto'}
                                            </span>
                                                        </Dropdown.Toggle>
                                                        <Dropdown.Menu className="w-100">
                                                            {budgets.map((budget) => {
                                                                const isSelected = selectedBudget?.id === budget.id;

                                                                return (
                                                                    <Dropdown.Item key={budget.id}
                                                                                   onClick={(e) => {
                                                                                       e.preventDefault();
                                                                                       selectBudget(budget);
                                                                                   }}
                                                                    >
                                                                        <div className="d-flex justify-content-between align-items-center">
                                                                            <span>{budget.name}</span>
                                                                            {isSelected && (
                                                                                <FontAwesomeIcon icon={['fas', 'check']} className="ms-1" />
                                                                            )}
                                                                        </div>
                                                                    </Dropdown.Item>
                                                                );
                                                            })}
                                                        </Dropdown.Menu>
                                                    </Dropdown>
                                                )
                                            }
                                        </div>
                                        <div className="requestDiv">
                                            <label className="requestLabel">Usuario (username):</label>
                                            <input type="text" className="requestInput appInput form-control"
                                                   value={requestUsername || ''}
                                                   onChange={(e) => setRequestUsername(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="w-100 d-flex justify-content-between align-items-center mt-2">
                                        {
                                            error ? (
                                                <span className="alert alert-danger p-1 ps-4 pe-4 mb-1 mt-1 ms-2" style={{ fontSize: '0.8rem'}}>
                                                    <FontAwesomeIcon icon={['fas', 'triangle-exclamation']} className="me-2"/>
                                                    {error}
                                                </span>
                                            ): (
                                                <div></div>
                                            )
                                        }
                                        <button className="btn btn-primary appIndButton" style={{marginRight: '2rem'}} onClick={makeRequest}
                                                disabled={requestUsername?.length === 0 || !selectedBudget}>
                                            <FontAwesomeIcon icon={['fas', 'person-circle-question']} />
                                            <span className="ms-2">Solicitar</span>
                                        </button>
                                    </div>
                                </form>
                            </div>
                            {
                                isTableMobile ? (
                                    <div className="w-95 mx-auto">

                                        <div className="budget-header-mobile mb-3">
                                            <h5 className="text-center m-0">Solicitudes pendientes</h5>
                                        </div>

                                        {pendingRequests.length > 0 ? (
                                            <div className="d-flex flex-column gap-3">
                                                {pendingRequests.map((request) => {
                                                    const tipo = request.requestingUser === userName ? 'Enviada' : 'Recibida';
                                                    const usuario = request.requestingUser === userName ? request.requestedUser : request.requestingUser;

                                                    return (
                                                        <div key={request.id} className="budget-card-mobile mb-3">
                                                            <div className="budget-card-header">
                                                                <h5>{request.budgetName}</h5>
                                                            </div>

                                                            <div className="budget-card-body">
                                                                <div className="budget-info-item">
                                                                    <FontAwesomeIcon icon={['fas', 'exchange-alt']} className="me-2 fa-sm" />
                                                                    <strong className="me-2">Tipo:</strong>{tipo}
                                                                </div>
                                                                <div className="budget-info-item">
                                                                    <FontAwesomeIcon icon={['fas', 'user']} className="me-2 fa-sm" />
                                                                    <strong className="me-2">Usuario:</strong>{usuario}
                                                                </div>
                                                                <div className="budget-info-item">
                                                                    <FontAwesomeIcon icon={['fas', 'calendar-alt']} className="me-2 fa-sm" />
                                                                    <strong className="me-2">Fecha:</strong>{formatDate(request.date)}
                                                                </div>
                                                                {
                                                                    (tipo === 'Enviada') && (
                                                                        <div className="budget-info-item w-100">
                                                                            <FontAwesomeIcon icon={['fas', 'info-circle']} className="me-2 fa-sm" />
                                                                            <strong className="me-2">Estado:</strong>Pendiente
                                                                        </div>
                                                                    )
                                                                }

                                                            </div>

                                                            {tipo === 'Recibida' && (
                                                                <div className="budget-card-actions mt-3">
                                                                    <button className="btn btn-success appTableButton" onClick={() => updateRequest(request, true)}>Aceptar</button>
                                                                    <button className="btn btn-danger appTableButton" onClick={() => updateRequest(request, false)}>Rechazar</button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="alert alert-warning text-center p-3">
                                                <p className="mb-0">No tienes solicitudes pendientes de resolver.</p>
                                            </div>
                                        )}

                                        <div className="budget-header-mobile budget-header-mobile-second mt-5 mb-3">
                                            <h5 className="text-center m-0">Historial de solicitudes</h5>
                                        </div>

                                        {historicRequests.length > 0 ? (
                                            <div className="d-flex flex-column gap-3">
                                                {historicRequests.map((request) => {
                                                    const tipo = request.requestingUser === userName ? 'Enviada' : 'Recibida';
                                                    const usuario = request.requestingUser === userName ? request.requestedUser : request.requestingUser;

                                                    return (
                                                        <div key={request.id} className="budget-card-mobile mb-3">
                                                            <div className="budget-card-header">
                                                                <h5>{request.budgetName}</h5>
                                                            </div>

                                                            <div className="budget-card-body">
                                                                <div className="budget-info-item">
                                                                    <FontAwesomeIcon icon={['fas', 'exchange-alt']} className="me-2 fa-sm" />
                                                                    <strong className="me-2">Tipo:</strong>{tipo}
                                                                </div>
                                                                <div className="budget-info-item">
                                                                    <FontAwesomeIcon icon={['fas', 'user']} className="me-2 fa-sm" />
                                                                    <strong className="me-2">Usuario:</strong>{usuario}
                                                                </div>
                                                                <div className="budget-info-item">
                                                                    <FontAwesomeIcon icon={['fas', 'calendar-alt']} className="me-2 fa-sm" />
                                                                    <strong className="me-2">Fecha:</strong>{formatDate(request.date)}
                                                                </div>
                                                                <div className="budget-info-item w-100">
                                                                    <FontAwesomeIcon icon={['fas', request.accepted ? 'check-circle' : 'times-circle']} className="me-2 fa-sm" />
                                                                    <strong className="me-2">Estado:</strong>{request.accepted ? 'Aceptada' : 'Rechazada'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="alert alert-warning text-center p-3">
                                                <p className="mb-0">No tienes solicitudes resueltas.</p>
                                            </div>
                                        )}

                                    </div>
                                ) : (
                                    <>
                                        <span className="w-95 text-start mb-3 appTableTitle"> Solicitudes pendientes:</span>
                                        <div className="appTableContainer">
                                            <table className="table table-hover table-bordered appTable">
                                                <thead className="appTableHeader">
                                                <tr>
                                                    <th className="text-center" style={{width: '20%'}}>
                                                        Tipo
                                                    </th>
                                                    <th className="text-center" style={{width: '20%'}}>
                                                        Usuario
                                                    </th>
                                                    <th className="text-center" style={{width: '20%'}}>
                                                        Presupuesto
                                                    </th>
                                                    <th className="text-center" style={{width: '20%'}}>
                                                        Fecha
                                                    </th>
                                                    <th className="text-center" style={{width: '20%', ...(isLineButtonsInTable ? {} : { minWidth: '225px' })}}
                                                    >
                                                        Estado
                                                    </th >
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {
                                                    pendingRequests.length ? (
                                                        pendingRequests.map((request) => (
                                                            <tr key={request.id}>
                                                                <td className="text-center">
                                                                    {request.requestingUser === userName ? 'Enviada' : 'Recibida'}
                                                                </td>
                                                                <td className="text-center">
                                                                    {request.requestingUser === userName ? request.requestedUser : request.requestingUser}
                                                                </td>
                                                                <td className="text-center">
                                                                    {request.budgetName}
                                                                </td>
                                                                <td className="text-center">
                                                                    {formatDate(request.date)}
                                                                </td>
                                                                <td className="text-center" style={{minWidth: '12.5rem'}}>
                                                                    {
                                                                        request.requestingUser === userName ? (
                                                                            'Pendiente'
                                                                        ) : (
                                                                            <>
                                                                                <button className="btn btn-success appTableButton m-1" onClick={() => updateRequest(request, true)}>Aceptar</button>
                                                                                <button className="btn btn-danger appTableButton m-1" onClick={() => updateRequest(request, false)}>Rechazar</button>
                                                                            </>
                                                                        )
                                                                    }
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="7" className="p-0 m-0">
                                                                <div className="m-0 p-0 d-flex flex-column align-items-center text-center" style={{backgroundColor: '#fff3cd'}}>
                                                                    <span className="mt-4 mb-4">No tienes solicitudes pendientes de resolver.</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )
                                                }
                                                </tbody>
                                            </table>
                                        </div>

                                        <span className="w-95 text-start mb-3 mt-5 appTableTitle"> Historial de solicitudes:</span>
                                        <div className="appTableContainer">
                                            <table className="table table-hover table-bordered appTable">
                                                <thead className="appTableHeaderSecondary">
                                                <tr>
                                                    <th className="text-center" style={{width: '20%'}}>
                                                        Tipo
                                                    </th>
                                                    <th className="text-center" style={{width: '20%'}}>
                                                        Usuario
                                                    </th>
                                                    <th className="text-center" style={{width: '20%'}}>
                                                        Presupuesto
                                                    </th>
                                                    <th className="text-center" style={{width: '20%'}}>
                                                        Fecha
                                                    </th>
                                                    <th className="text-center" style={{width: '20%'}}>
                                                        Estado
                                                    </th >
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {
                                                    historicRequests.length ? (
                                                        historicRequests.map((request) => (
                                                            <tr key={request.id}>
                                                                <td className="text-center">
                                                                    {request.requestingUser === userName ? 'Enviada' : 'Recibida'}
                                                                </td>
                                                                <td className="text-center">
                                                                    {request.requestingUser === userName ? request.requestedUser : request.requestingUser}
                                                                </td>
                                                                <td className="text-center">
                                                                    {request.budgetName}
                                                                </td>
                                                                <td className="text-center">
                                                                    {formatDate(request.date)}
                                                                </td>
                                                                <td className="text-center">
                                                                    {request.accepted ? 'Aceptada' : 'Rechazada'}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="7" className="p-0 m-0">
                                                                <div className="m-0 p-0 d-flex flex-column align-items-center text-center" style={{backgroundColor: '#fff3cd'}}>
                                                                    <span className="mt-4 mb-4">No tienes solicitudes resueltas.</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )
                                                }
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )
                            }
                        </div>
                    </>
                )
            }
        </>
    )
}

export default Requests;
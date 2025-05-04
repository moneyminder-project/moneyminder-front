import {useTitleWithAppName} from "../../hooks/commonHooks/useTitle.jsx";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {createBudget, deleteBudget, getBudgetById, updateBudget} from "../../serviceApiCalls/BudgetApiService.jsx";
import {deleteRecord, getRecordsByBudgetId} from "../../serviceApiCalls/RecordApiService.jsx";
import {getUsernameByGroup} from "../../serviceApiCalls/GroupApiService.jsx";
import {formatDate, formatNumber} from "../../utils/Formatters.jsx";
import {RecordType} from "../../utils/RecordTypeEnum.jsx";
import {Tooltip} from "react-tooltip";
import {errorSwal, successSwal} from "../../utils/SwalUtils.jsx";
import Swal from "sweetalert2";
import {useAuth} from "../../contexts/AuthContext.jsx";
import Loading from "../loading/Loading.jsx";
import {
    useIsButtonMobile,
    useIsLineButtonsInTable,
    useIsMenuMobile,
    useIsTableMobile
} from "../../hooks/responsiveHooks.jsx";

function BudgetIndividual() {
    useTitleWithAppName('Presupuestos');
    const { userName } = useAuth();
    const navigate = useNavigate();
    const { budgetId: budgetIdByParam } = useParams();
    const [editMode, setEditMode] = useState(false);
    const [records, setRecords] = useState([]);
    const [error, setError] = useState(null);
    const [usernames, setUsernames] = useState([]);
    const [budget, setBudget] = useState({
        id: '',
        name: '',
        comment: '',
        startDate: '',
        endDate: '',
        expensesLimit: '',
        favorite: false,
        groupId: '',
        records: []
    });
    const [originalBudget, setOriginalBudget] = useState(null);
    const [totalExpenses, setTotalExpenses] = useState(null);
    const [totalIncomes, setTotalIncomes] = useState(null);
    const [errorSetInitialBudget, setErrorSetInitialBudget] = useState('');
    const [errorSetInitialRecords, setErrorSetInitialRecords] = useState('');
    const [loading, setLoading] = useState(false);
    const isButtonMobile = useIsButtonMobile();
    const isMenuMobile = useIsMenuMobile();
    const isTableMobile = useIsTableMobile();
    const isLineButtonsInTable = useIsLineButtonsInTable();

    const gotoRegister = () => {
        navigate(`/record`);
    }

    const goToRegisterWithId = (id) => {
        navigate(`/record/${id}`);
    }

    useEffect(() => {
        setLoading(true);
        setErrorSetInitialRecords(null);
        setErrorSetInitialBudget(null);

        const fetchData = async () => {
            try {
                setEditMode(!budgetIdByParam);

                if (budgetIdByParam) {
                    const [budgetResponse, recordsResponse] = await Promise.all([
                        getBudgetById(budgetIdByParam),
                        getRecordsByBudgetId(budgetIdByParam)
                    ]);

                    if (!budgetResponse.ok) {
                        setErrorSetInitialBudget('No se ha podido obtener el presupuesto inicial.')
                        navigate(`/budget`);
                    } else {
                        setBudget(budgetResponse.respuesta);
                        setOriginalBudget(budgetResponse.respuesta);

                        getUsernameByGroup(budgetResponse.respuesta.groupId).then((response) => {
                            if (!response.ok) {
                                setUsernames([]);
                            } else {
                                setUsernames(response.respuesta || []);
                            }
                        })
                    }

                    if (!recordsResponse.ok) {
                        setRecords([]);
                        setErrorSetInitialRecords('No se han podido obtener los registros iniciales.')
                    } else {
                        const records = recordsResponse.respuesta || [];
                        setRecords(records);

                        setTotalExpenses(
                            records.reduce((sum, record) => (
                                record.type === RecordType.EXPENSE ? sum + record.money : sum
                            ), 0)
                        );

                        setTotalIncomes(
                            records.reduce((sum, record) => (
                                record.type === RecordType.INCOME ? sum + record.money : sum
                            ), 0)
                        );
                    }
                    setLoading(false);

                } else {
                    setRecords([]);
                    setUsernames([]);
                    setLoading(false);
                }

            } catch (error) {
                setLoading(false);
                console.log('Error al obtener los datos iniciales', error);
            }
        }

        fetchData();
    }, [budgetIdByParam]);

    const saveBudget = (event) => {
        event.preventDefault();
        setError(null);

        if (!budget.name || !budget.name.length) {
            setError('El presupuesto debe tener un nombre')
            return;
        }

        if (budget.startDate && budget.endDate && budget.endDate < budget.startDate) {
            setError('La fecha final no puede ser anterior a la fecha inicial');
            return;
        }

        if (!budget.id) {
            createBudget(
                budget.name,
                budget.comment,
                budget.startDate,
                budget.endDate,
                budget.expensesLimit,
                budget.favorite
            ).then((response) => {
                if (!response.ok) {
                    errorSwal('Error al crear el presupuesto', 'No se ha podido crear el presupuesto.');
                } else {
                    setBudget(response.respuesta);
                    setEditMode(false);
                    successSwal('Presupuesto creado', 'El presupuesto se ha creado correctamente.');
                    navigate(`/budget/${response.respuesta.id}`);
                }
            });
        } else {
            console.log('edited budget: ', budget);
            updateBudget(
                budget.id,
                budget.name,
                budget.comment,
                budget.startDate,
                budget.endDate,
                budget.expensesLimit,
                budget.favorite
            ).then((response) => {
                if (!response.ok) {
                    errorSwal('Error al actualizar el presupuesto', 'No se ha podido actualizar el presupuesto.');
                } else {
                    console.log('Respuesta: ', response.respuesta);
                    setBudget(response.respuesta);
                    setEditMode(false);
                    successSwal('Presupuesto actualizado', 'El presupuesto se ha actualizado correctamente');
                }
            })
        }
    };

    const cancelEdition = () => {
        if (!budgetIdByParam) return;
        setEditMode(false);
        if (originalBudget) {
            setBudget(originalBudget);
        }
        setError(null)
    };

    const createNewBudget = () => {
        setBudget({
            id: '',
            name: '',
            comment: '',
            startDate: '',
            endDate: '',
            expensesLimit: '',
            favorite: '',
            groupId: '',
            records: []
        });
        setRecords([]);
        setEditMode(true);
        setError(null);
        navigate('/budget');
    };

    const makeDeleteBudget = async (event) => {
        event.preventDefault();
        if (!budget.id) {
            errorSwal('Error al eliminar el presupuesto', 'No se ha podido eliminar el presupuesto al no encontrarse su identificador');
            return;
        }

        const result = await Swal.fire({
            title: '¿Deseas eliminar el presupuesto?',
            text: `El presupuesto "${budget.name}" será borrado`,
            icon: 'warning',

            showCancelButton: true,
            confirmButtonText: 'Borrar',
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
            deleteBudget(budget.id).then((response) => {
                if(!response.ok) {
                    errorSwal('Error al eliminar el presupuesto', 'No se ha podido eliminar el presupuesto');
                    return;
                }

                successSwal('Presupuesto eliminado', 'El presupuesto se ha eliminado con éxito.');
                createNewBudget();
            })
        }
    };

    const makeDeleteRecord = (recordId) => {
        Swal.fire({
            title: '¿Deseas eliminar el registro?',
            text: 'Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Borrar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            customClass: {
                title: 'swal2-title-sm',
                popup: 'swal2-popup-sm',
                confirmButton: 'swal2-btn-sm',
                cancelButton: 'swal2-btn-sm',
                htmlContainer: 'swal2-text-sm'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                deleteRecord(recordId).then((response) => {
                    if (!response.ok) {
                        errorSwal('Error al eliminar el registro', 'No se ha podido eliminar el registro');
                        return;
                    }

                    const updatedRecords = records.filter(d => d.id !== recordId);

                    setRecords(updatedRecords);

                    setBudget(prev => ({
                        ...prev,
                        records: prev.records.filter(record => record.id !== recordId)
                    }));

                    setTotalExpenses(
                        updatedRecords.reduce((sum, record) => (
                            record.type === RecordType.EXPENSE ? sum + record.money : sum
                        ), 0)
                    );

                    setTotalIncomes(
                        updatedRecords.reduce((sum, record) => (
                            record.type === RecordType.INCOME ? sum + record.money : sum
                        ), 0)
                    );

                    successSwal('Registro eliminado', 'El registro se eliminó correctamente.');
                });
            }
        });
    };

    return (
        <>
            <div className="subheaderStyle d-flex justify-content-between align-items-center">
                <div className="ms-2">
                    {!budgetIdByParam ? 'Nuevo' : 'Detalle de'} presupuesto
                </div>
                <div className="d-flex justify-content-between align-items-center">
                    {
                        isButtonMobile ? (
                            <button className="me-2 btn btn-outline-dark subheaderBackButtonOnlyIcon" onClick={() => navigate(-1)} disabled={loading}>
                                <FontAwesomeIcon icon={['fas', 'chevron-left']} className="fa-sm"/>
                            </button>
                        ) : (
                            <button className="me-3 btn btn-outline-dark subheaderBackButton" onClick={() => navigate(-1)} disabled={loading}>
                                <FontAwesomeIcon icon={['fas', 'chevron-left']} className="me-2 fa-sm"/>
                                Ir atrás
                            </button>
                        )
                    }
                    {
                        budgetIdByParam ? (
                            isButtonMobile ? (
                                <>
                                    <div>
                                        <button className="me-2 subheaderButton subheaderIndividualButtonOnlyIcon" disabled={editMode || loading}
                                                onClick={createNewBudget}>
                                            <FontAwesomeIcon icon={['fas', 'plus']} className="fa-sm"/>
                                        </button>
                                    </div>
                                    <div>
                                        <button className="me-2 btn btn-secondary subheaderIndividualButtonOnlyIcon" disabled={editMode || loading}
                                                onClick={() => setEditMode(true)}>
                                            <FontAwesomeIcon icon={['fas', 'pen']} className="fa-sm"/>
                                        </button>
                                    </div>
                                    <div>
                                        <button className="me-2 btn btn-danger subheaderIndividualButtonOnlyIcon"
                                                disabled={editMode || loading} onClick={makeDeleteBudget}>
                                            <FontAwesomeIcon icon={['fas', 'trash']} className="fa-sm"/>
                                        </button>
                                    </div>
                                </>

                            ) : (
                                <>
                                    <div>
                                        <button className="me-3 subheaderButton subheaderIndividualButton" disabled={editMode || loading}
                                                onClick={createNewBudget}>
                                            <FontAwesomeIcon icon={['fas', 'plus']} className="me-2 fa-sm"/>
                                            Crear
                                        </button>
                                    </div>
                                    <div>
                                        <button className="me-3 btn btn-secondary subheaderIndividualButton" style={{fontSize: '0.9rem'}} disabled={editMode || loading}
                                                onClick={() => setEditMode(true)}>
                                            <FontAwesomeIcon icon={['fas', 'pen']} className="me-2 fa-sm"/>
                                            Modificar
                                        </button>
                                    </div>
                                    <div>
                                        <button className="me-3 btn btn-danger subheaderIndividualButton" style={{fontSize: '0.9rem'}}
                                                disabled={editMode || loading} onClick={makeDeleteBudget}>
                                            <FontAwesomeIcon icon={['fas', 'trash']} className="me-2 fa-sm"/>
                                            Eliminar
                                        </button>
                                    </div>
                                </>
                            )

                        ) : (
                            <></>
                        )
                    }
                </div>
            </div>
            {
                loading ? (
                    <Loading></Loading>
                ) : (
                    <>
                        <div className={`d-flex flex-column align-items-center ${!isMenuMobile && 'mt-4'}`}>
                            {errorSetInitialBudget && (
                                <span className="alert alert-danger p-1 ps-4 pe-4 mb-1 mt-1 w-95 text-center">
                    <FontAwesomeIcon icon={['fas', 'triangle-exclamation']} className="me-2"/>
                                    {errorSetInitialBudget}
                </span>
                            )}
                            {errorSetInitialRecords && (
                                <span className="alert alert-danger p-1 ps-4 pe-4 mb-1 mt-1 w-95 text-center">
                    <FontAwesomeIcon icon={['fas', 'triangle-exclamation']} className="me-2"/>
                                    {errorSetInitialRecords}
                </span>
                            )}
                        </div>
                        <div className={`d-flex flex-column align-items-center ${isMenuMobile ? 'mt-3' : (errorSetInitialBudget || errorSetInitialRecords) ? 'mt-3' : 'mt-5'}`}>
                            <div className="appSection d-flex flex-wrap mb-5 p-3">
                <span className="appTableTitle mt-0">
                    Datos:
                </span>
                                <form onSubmit={saveBudget}>
                                    <div className="d-flex flex-wrap mt-2">
                                        <div className="filterDiv">
                                            <label className="filterLabel">Nombre:</label>
                                            <input
                                                type="text"
                                                className="filterInput appInput form-control"
                                                disabled={!editMode}
                                                value={budget.name}
                                                onChange={(e) => setBudget({ ...budget, name: e.target.value })}
                                            />
                                        </div>

                                        <div className="filterDiv">
                                            <label className="filterLabel">Límite de gasto:</label>
                                            {editMode ? (
                                                <input type="number" step="0.01" className="filterInput appInput form-control text-end"
                                                       value={budget.expensesLimit} onChange={(e) => setBudget({ ...budget, expensesLimit: e.target.value })}/>
                                            ) : (
                                                <div className="form-control text-end filterInput appInput pe-4" style={{ background: '#e9ecef' }}>
                                                    {formatNumber(budget.expensesLimit)}
                                                </div>
                                            )}
                                        </div>

                                        <div className="filterDiv">
                                            <label className="filterLabel">Fecha inicial:</label>
                                            {
                                                (editMode || budget.startDate) ? (
                                                    <input
                                                        type="date"
                                                        className="filterInput appInput form-control text-end"
                                                        disabled={!editMode}
                                                        value={budget.startDate || ''}
                                                        onChange={(e) => setBudget({ ...budget, startDate: e.target.value })}
                                                    />
                                                ) : (
                                                    <input
                                                        type="text"
                                                        className="filterInput appInput form-control text-end"
                                                        disabled={true}
                                                        value={'–    '}
                                                    />
                                                )
                                            }
                                        </div>

                                        <div className="filterDiv">
                                            <label className="filterLabel">Fecha final:</label>
                                            {
                                                (editMode || budget.endDate) ? (
                                                    <input
                                                        type="date"
                                                        className="filterInput appInput form-control text-end"
                                                        min={budget.startDate || undefined}
                                                        disabled={!editMode}
                                                        value={budget.endDate || ''}
                                                        onChange={(e) => setBudget({ ...budget, endDate: e.target.value })}
                                                        onBlur={() => {
                                                            if (budget.startDate && budget.endDate && budget.endDate < budget.startDate) {
                                                                setBudget({ ...budget, endDate: budget.startDate });
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <input
                                                        type="text"
                                                        className="filterInput appInput form-control text-end"
                                                        disabled={true}
                                                        value={'–    '}
                                                    />
                                                )
                                            }
                                        </div>

                                        <div className="filterDiv">
                                            <label className="filterLabel">Comentario:</label>
                                            <input
                                                type="text"
                                                className="filterInput appInput form-control"
                                                disabled={!editMode}
                                                value={budget.comment}
                                                onChange={(e) => setBudget({ ...budget, comment: e.target.value })}
                                            />
                                        </div>

                                        <div className="filterDiv">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <label className="filterLabel align-items-end" style={{width: '5rem'}}>Favorito:</label>
                                                {
                                                    (editMode) ? (
                                                        <select
                                                            className="form-control appInput form-select"
                                                            value={budget.favorite !== undefined ? budget.favorite.toString() : 'false'}
                                                            style={{width: '80px', textAlignLast: 'center'}}
                                                            disabled={!editMode}
                                                            onChange={(e) =>
                                                                setBudget({...budget, favorite: e.target.value === 'true'})
                                                            }>
                                                            <option value="true">Sí</option>
                                                            <option value="false">No</option>
                                                        </select>
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            className="appInput form-control"
                                                            disabled={true}
                                                            style={{maxWidth: '7rem', textAlignLast: 'center', padding: '0.2rem 0.5rem'}}
                                                            value={budget.favorite ? 'Sí' : 'No'}
                                                        />
                                                    )
                                                }
                                            </div>
                                            {
                                                !editMode && (
                                                    <div className="d-flex justify-content-between align-items-center ms-4">
                                                        <label className="filterLabel align-items-end" style={{width: '4.7rem'}}>Usuarios:</label>
                                                        <span data-tooltip-id="users-tooltip" style={{ cursor: 'default', padding: '0.24rem 0.7rem', background: '#e9ecef' }}
                                                              className="appInput">
                                            {usernames.length}
                                                            <FontAwesomeIcon icon={['fas', 'users']} className="ms-2"/>
                                        </span>
                                                        <Tooltip
                                                            id="users-tooltip"
                                                            place="right"
                                                            className="tooltip-custom-style"
                                                            render={() => (
                                                                <div style={{ textAlign: 'left' }}>
                                                                    {usernames.map((username, index) => (
                                                                        <div key={index}>{username}</div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        />
                                                    </div>
                                                )
                                            }
                                        </div>
                                        {
                                            editMode && (
                                                <div className="d-flex justify-content-between align-items-center w-100 mt-4 me-3">
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
                                                    <div>
                                                        <button className={`btn btn-primary appIndButton ${!budgetIdByParam ? 'me-3' : ''}`} style={{width:'115px'}}>
                                                            <FontAwesomeIcon icon={['fas', !budgetIdByParam && editMode ? 'save' : 'pen']} />
                                                            <span className="ms-2">{!budgetIdByParam && editMode ? 'Guardar' : 'Editar'}</span>
                                                        </button>
                                                        {
                                                            budgetIdByParam &&
                                                            <button className="btn btn-secondary appIndButton ms-3 me-3"  style={{width:'115px'}}
                                                                    onClick={cancelEdition}>
                                                                <FontAwesomeIcon icon={['fas', 'xmark']} />
                                                                <span className="ms-2">Cancelar</span>
                                                            </button>
                                                        }
                                                    </div>
                                                </div>
                                            )
                                        }
                                    </div>
                                </form>
                            </div>
                            {
                                budget.id && (
                                    <>
                                        {
                                            isTableMobile ? (
                                                <div className="w-95 mx-auto">
                                                    <div className="budget-header-mobile mb-3 d-flex justify-content-between align-items-center flex-wrap px-3 py-2">
                                                        <h5 className="text-start ms-1 m-0 flex-grow-1 text-start">Registros del presupuesto</h5>
                                                        {records.length > 0 && (
                                                            <button className="btn btn-warning appIndButton mt-sm-0 ms-sm-3" onClick={gotoRegister}>
                                                                <FontAwesomeIcon icon={['fas', 'plus']} />
                                                                <span className="ms-2">Registro</span>
                                                            </button>
                                                        )}
                                                    </div>

                                                    {records.length > 0 ? (
                                                        <div className="d-flex flex-column gap-3">
                                                            {records.map((record) => (
                                                                <div key={record.id} className="budget-card-mobile mb-3">
                                                                    <div className="budget-card-header">
                                                                        <h5 className="text-capitalize">{record.name}</h5>
                                                                    </div>

                                                                    <div className="budget-card-body">
                                                                        <div className="budget-info-item">
                                                                            <FontAwesomeIcon icon={['fas', record.type === 'EXPENSE' ? 'arrow-down' : 'arrow-up']} className="me-2 fa-sm" />
                                                                            <strong className="me-2">Tipo:</strong>{record.type === 'EXPENSE' ? 'Gasto' : 'Ingreso'}
                                                                        </div>
                                                                        <div className="budget-info-item">
                                                                            <FontAwesomeIcon icon={['fas', 'calendar-alt']} className="me-2 fa-sm" />
                                                                            <strong className="me-2">Fecha:</strong>{formatDate(record.date)}
                                                                        </div>
                                                                        <div className="budget-info-item">
                                                                            <FontAwesomeIcon icon={['fas', 'money-bill-wave']} className="me-2 fa-sm" />
                                                                            <strong className="me-2">Importe:</strong>{formatNumber(record.money)}
                                                                        </div>
                                                                        <div className="budget-info-item">
                                                                            <FontAwesomeIcon icon={['fas', 'user']} className="me-2 fa-sm" />
                                                                            <strong className="me-2">Usuario:</strong>{record.owner}
                                                                        </div>
                                                                        <div className="budget-info-item w-100">
                                                                            <FontAwesomeIcon icon={['fas', 'comment']} className="me-2 fa-sm" />
                                                                            <strong className="me-2">Comentario:</strong>{record.comment || '–'}
                                                                        </div>
                                                                    </div>

                                                                    <div className="budget-card-actions mt-3">
                                                                        <button className="btn btn-secondary appTableButton" onClick={() => goToRegisterWithId(record.id)}>Detalle</button>
                                                                        {userName === record.owner && (
                                                                            <button className="btn btn-danger appTableButton ms-4" onClick={() => makeDeleteRecord(record.id)}>Eliminar</button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="alert alert-warning text-center p-3">
                                                            <p className="mb-3">No tienes registros para este presupuesto. Crea uno pulsando en el botón:</p>
                                                            <button className="btn btn-warning appIndButton" onClick={gotoRegister}>
                                                                <FontAwesomeIcon icon={['fas', 'money-bill-wave']} />
                                                                <span className="ms-2">Añadir gasto o ingreso</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="d-flex justify-content-between align-items-center w-95">
                                                        <span className="w-95 text-start mb-3 appTableTitle">Registros del presupuesto:</span>
                                                        {
                                                            budget.records.length > 0 && (
                                                                <button className="btn btn-warning appIndButton mb-2 me-2" style={{minWidth:'175px'}} onClick={gotoRegister} >
                                                                    <FontAwesomeIcon icon={['fas', 'money-bill-wave']} />
                                                                    <span className="ms-2">Añadir registro</span>
                                                                </button>
                                                            )
                                                        }
                                                    </div>
                                                    <div className="appTableContainer">
                                                        <table className="table table-hover table-bordered appTable">
                                                            <thead className="appTableHeader">
                                                            <tr>
                                                                <th className="text-center" style={{width: '5%'}}>
                                                                    Tipo
                                                                </th>
                                                                <th style={{width: '20%'}}>
                                                                    Nombre
                                                                </th>
                                                                <th className="text-center" style={{width: '12%'}}>
                                                                    Importe
                                                                </th>
                                                                <th className="text-center" style={{width: '10%'}}>
                                                                    Fecha
                                                                </th>
                                                                <th className="text-center" style={{width: '14%'}}>
                                                                    Usuario
                                                                </th>
                                                                <th style={{width: '25%'}}>
                                                                    Comentario
                                                                </th>
                                                                <th className="text-center" style={isLineButtonsInTable ? {} : { minWidth: '225px' }}>
                                                                </th>
                                                            </tr>
                                                            </thead>
                                                            <tbody>
                                                            {
                                                                records.length > 0 ? (
                                                                    records.map((record) => (
                                                                        <tr key={record.id}>
                                                                            <td className="text-center">
                                                                                {record.type === RecordType.EXPENSE ? 'Gto' : 'Ing'}
                                                                            </td>
                                                                            <td>
                                                                                {record.name}
                                                                            </td>
                                                                            <td className="text-end pe-4">
                                                                                {formatNumber(record.money)}
                                                                            </td>
                                                                            <td className="text-center pe-2">
                                                                                {formatDate(record.date)}
                                                                            </td>
                                                                            <td className="text-end pe-4">
                                                                                {record.owner}
                                                                            </td>
                                                                            <td>
                                                                                {record.comment}
                                                                            </td>
                                                                            <td className="text-center">
                                                                                <button className="btn btn-secondary appTableButton m-1" onClick={() => goToRegisterWithId(record.id)}>Detalle</button>
                                                                                {
                                                                                    (userName === record.owner) && (
                                                                                        <button className="btn btn-danger appTableButton m-1" onClick={() => makeDeleteRecord(record.id)}>Eliminar</button>
                                                                                    )
                                                                                }
                                                                            </td>
                                                                        </tr>
                                                                    ))
                                                                ) : (
                                                                    <tr>
                                                                        <td colSpan="7" className="p-0 m-0">
                                                                            <div className="m-0 p-0 d-flex flex-column align-items-center text-center"
                                                                                 style={{ backgroundColor: '#fff3cd' }}>
                                                                        <span className="mt-4">
                                                                            No tienes registros para este presupuesto. Crea uno pulsando en el botón
                                                                        </span>
                                                                                <button className="btn btn-warning mt-4 mb-4 appIndButton" onClick={gotoRegister}>
                                                                                    <FontAwesomeIcon icon={['fas', 'money-bill-wave']} />
                                                                                    <span className="ms-2">Añadir gasto o ingreso</span>
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                )
                                                            }

                                                            {
                                                                records.length > 0 && (
                                                                    <>
                                                                        <tr>
                                                                            <td className="text-end" colSpan="2">
                                                                                <span className="fw-bold">Suma gastos:</span>
                                                                            </td>
                                                                            <td className="text-end pe-4">
                                                                                <span className="fw-bold">{formatNumber(totalExpenses)}</span>
                                                                            </td>
                                                                            <td colSpan="4"></td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td className="text-end" colSpan="2">
                                                                                <span className="fw-bold">Suma ingresos:</span>
                                                                            </td>
                                                                            <td className="text-end pe-4">
                                                                                <span className="fw-bold">{formatNumber(totalIncomes)}</span>
                                                                            </td>
                                                                            <td colSpan="4"></td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td className="text-end" colSpan="2">
                                                                                <span className="fw-bold">Total presupuesto:</span>
                                                                            </td>
                                                                            <td className="text-end pe-4">
                                                                                <span className="fw-bold">{formatNumber(totalIncomes - totalExpenses)}</span>
                                                                            </td>
                                                                            <td colSpan="4"></td>
                                                                        </tr>
                                                                    </>
                                                                )
                                                            }
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </>
                                            )
                                        }
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

export default BudgetIndividual;
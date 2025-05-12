import {useTitleWithAppName} from "../../hooks/commonHooks/useTitle.jsx";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import React, {useEffect, useState} from "react";
import {Dropdown} from "react-bootstrap";
import {useAuth} from "../../contexts/AuthContext.jsx";
import {createRecord, deleteRecord, getRecordById, updateRecord} from "../../serviceApiCalls/RecordApiService.jsx";
import {getBudgets} from "../../serviceApiCalls/BudgetApiService.jsx";
import {formatInteger, formatNumber} from "../../utils/Formatters.jsx";
import {useNavigate, useParams} from "react-router-dom";
import Swal from "sweetalert2";
import {createDetail, deleteDetail, getDetails, updateDetail} from "../../serviceApiCalls/DetailApiService.jsx";
import {errorSwal, successSwal} from "../../utils/SwalUtils.jsx";
import Loading from "../loading/Loading.jsx";
import {
    useIsButtonMobile,
    useIsLineButtonsInTable,
    useIsMenuMobile,
    useIsTableMobile
} from "../../hooks/responsiveHooks.jsx";

function RecordIndividual() {
    useTitleWithAppName("Ingreso / Gasto");
    const { recordId: recordIdByParam, budgetId: budgetIdByParam } = useParams();
    const { userName } = useAuth();
    const navigate = useNavigate();
    const [loadingDetails, setLoadingDetails] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [budgets, setBudgets] = useState([]);
    const [budgetMap, setBudgetMap] = useState(new Map());
    const [completeDetails, setCompleteDetails] = useState([]);
    const [totalDetails, setTotalDetails] = useState( null);
    const [error, setError] = useState(null);
    const [record, setRecord] = useState({
        id: '',
        type: 'EXPENSE',
        name: '',
        money: '',
        date: '',
        comment: '',
        owner: userName,
        details: [],
        budgets: []
    });
    const [originalRecord, setOriginalRecord] = useState(null);
    const [newDetail, setNewDetail] = useState(null);
    const [editingDetailId, setEditingDetailId] = useState(null);
    const [isOwner, setIsOwner] = useState(false);
    const [errorInitialRecord, setErrorInitialRecord] = useState(null);
    const [errorInitialBudgets, setErrorInitialBudgets] = useState(null);
    const [loading, setLoading] = useState(false);
    const isButtonMobile = useIsButtonMobile();
    const isMenuMobile = useIsMenuMobile();
    const isTableMobile = useIsTableMobile();
    const isLineButtonsInTable = useIsLineButtonsInTable();

    useEffect(() => {
        setLoading(true);
        setErrorInitialRecord(null);
        setErrorInitialBudgets(null);

        const fetchData = async () => {
            try {
                setEditMode(!recordIdByParam);

                const [recordResponse, budgetsResponse] = await Promise.all([
                    recordIdByParam ? getRecordById(recordIdByParam) : null,
                    getBudgets()
                ]);

                if (recordIdByParam && recordResponse?.respuesta) {
                    setRecord(recordResponse.respuesta);
                    setOriginalRecord(recordResponse.respuesta);

                    setIsOwner(userName === recordResponse.respuesta.owner);

                    const fetchedDetails = recordResponse.respuesta.details || [];

                    if (fetchedDetails.length > 0) {
                        setLoadingDetails(true);
                        getDetails({ ids: recordResponse.respuesta.details }).then((response) => {
                            if (!response.ok) {
                                setCompleteDetails([]);
                                setTotalDetails(0);
                                setLoadingDetails(false);
                            } else {
                                const details = response.respuesta || [];
                                setCompleteDetails(details);
                                setTotalDetails(details.reduce((sum, detail) => sum + parseFloat(detail.totalPrice || 0), 0));
                                setLoadingDetails(false);
                            }
                        });
                    } else {
                        setCompleteDetails([]);
                        setTotalDetails(0);
                        setLoadingDetails(false);
                    }

                }

                if (recordIdByParam && !recordResponse.ok) {
                    setErrorInitialRecord('No se ha podido obtener el registro solicitado.');
                    navigate(`/record`);
                }

                if (budgetsResponse?.ok) {
                    const budgetsData = budgetsResponse.respuesta || [];
                    setBudgets(budgetsData);

                    const map = new Map();
                    budgetsData.forEach(budget => {
                        map.set(budget.id, budget);
                    });

                    setBudgetMap(map);

                    if (!recordIdByParam && budgetIdByParam) {
                        const exists = budgetsData.some(b => b.id === budgetIdByParam);
                        if (exists) {
                            setEditMode(true);
                            setRecord((prev) => ({
                                ...prev,
                                budgets: [budgetIdByParam],
                            }));
                        }
                    }

                } else {
                    setErrorInitialBudgets('No se han podido obtener los presupuestos del usuario.')
                }

                setLoading(false);

            } catch (error) {
                console.error('Error al obtener los datos iniciales', error);
                setLoading(false);
            }

            if (!recordIdByParam) {
                setCompleteDetails([]);
                setTotalDetails(0);
                setLoadingDetails(false);
                setLoading(false);
            }
        };

        fetchData();
    }, [recordIdByParam]);

    const saveRecord = (event) => {
        event.preventDefault();
        setError('');

        if (!record.name || !record.name.length) {
            setError('El registro debe tener nombre, importe y fecha de registro.');
            return;
        }

        if (!record.money) {
            setError('El registro debe tener nombre, importe y fecha de registro.');
            return;
        }

        if (!record.date || !record.date.length) {
            setError('El registro debe tener nombre, importe y fecha de registro.');
            return;
        }

        const invalidBudgets = record.budgets
            .map(id => budgetMap.get(id))
            .filter(budget => {
                if (!budget) return false;
                const recordDate = new Date(record.date);
                const start = budget.startDate ? new Date(budget.startDate) : null;
                const end = budget.endDate ? new Date(budget.endDate) : null;
                return (start && recordDate < start) || (end && recordDate > end);
            });

        if (invalidBudgets.length > 0) {

            const htmlList = invalidBudgets.map(b => {
                const start = b.startDate ? new Date(b.startDate).toLocaleDateString() : null;
                const end = b.endDate ? new Date(b.endDate).toLocaleDateString() : null;

                let info = [];
                if (start) info.push(`Inicio: ${start}`);
                if (end) info.push(`Fin: ${end}`);

                return `<li><strong>${b.name}</strong> ${info.length ? ` (${info.join(', ')})` : ''}</li>`;
            }).join('');

            Swal.fire({
                icon: "error",
                title: "Presupuestos asociados no válidos",
                html: `El gasto con fecha ${new Date(record.date).toLocaleDateString()} no puede asociarse con los siguientes presupuestos por estar fuera de su rango de fechas:<ul>${htmlList}</ul>`,
                showConfirmButton: true,
                confirmButtonText: 'Aceptar',
                reverseButtons: true,
                allowOutsideClick: true,
                customClass: {
                    title: 'swal2-title-sm',
                    popup: 'swal2-popup-sm',
                    htmlContainer: 'swal2-text-sm text-start',
                    confirmButton: 'btn btn-secondary swal2-btn-sm'
                }
            });

            setError('El gasto no puede asociarse con presupuestos fuera de su rango de fechas.');
            return;
        }

        if (!record.id) {
            createRecord(
                record.type,
                record.name,
                record.money,
                record.date,
                record.comment,
                record.owner,
                record.details,
                record.budgets,
            ).then((response) => {
                if(!response.ok) {
                    errorSwal('Error al crear el registro', 'No se ha podido crear el registro');
                } else {
                    setRecord(response.respuesta);
                    setEditMode(false);
                    successSwal('Registro creado', 'El registro se ha creado correctamente.');
                    navigate(`/record/${response.respuesta.id}`);
                }
            });
        } else {
            updateRecord(
                record.id,
                record.type,
                record.name,
                record.money,
                record.date,
                record.comment,
                record.owner,
                record.details,
                record.budgets
            ).then((response) => {
                if(!response.ok) {
                    errorSwal('Error al actualizar el registro', 'No se ha podido actualizar el registro');
                } else {
                    setRecord(response.respuesta);
                    setEditMode(false);
                    successSwal('Registro actualizado', 'El registro se ha actualizado correctamente.');
                }
            })
        }
    }

    const createNewRecord = () => {
        setRecord({
            id: '',
            type: 'EXPENSE',
            name: '',
            money: '',
            date: '',
            comment: '',
            owner: userName,
            details: [],
            budgets: []
        });
        setCompleteDetails([]);
        setEditMode(true);
        setError(null);
        navigate('/record');
    };

    const cancelEdition = () => {
        if (!recordIdByParam) return;
        setEditMode(false);
        if (originalRecord) {
            setRecord(originalRecord);
        }
        setError(null);
    };

    const makeDeleteRecord = async (event) => {
        event.preventDefault();
        if (!record.id) {
            errorSwal('Error al eliminar el registro', 'No se ha podido eliminar el registro al no encontrarse su identificador');
            return;
        }

        const result = await Swal.fire({
            title: '¿Deseas eliminar el registro?',
            text: `El registro "${record.name}" será borrado`,
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
            deleteRecord(record.id).then((response) => {
                if(!response.ok) {
                    errorSwal('Error al eliminar el registro', 'No se ha podido eliminar el registro');
                    return;
                }

                successSwal('Registro eliminado', 'El registro se ha eliminado con éxito.');
                createNewRecord();
            })
        }
    }

    const makeNewDetail = () => {
        if (newDetail || editingDetailId) return;
        setNewDetail({
            name: '',
            pricePerUnit: '',
            units: ''
        });
    };

    const saveNewDetail = (detail) => {
        createDetail(detail.name, detail.pricePerUnit, detail.units, record.id).then((response) => {
            if (!response.ok) {
                errorSwal('Error al crear el detalle', `No se ha podido crear el detalle ${detail.name}`)
                return;
            }

            const detailCreated = response.respuesta;
            const updatedDetails = [...completeDetails, detailCreated];
            const updatedDetailsIds = [...record.details, detailCreated.id];

            setCompleteDetails(updatedDetails);
            setRecord({ ...record, details: updatedDetailsIds });
            setTotalDetails(updatedDetails.reduce((sum, d) => sum + parseFloat(d.totalPrice || 0), 0));
            setNewDetail(null);

            successSwal('Detalle creado', 'El detalle se ha creado con éxito.');
        })
    }

    const saveEditDetail = (detail) => {
        if (!detail.id) {
            console.error("No hay ID en el detalle a editar");
            return;
        }

        const price = parseFloat(detail.pricePerUnit || 0).toFixed(2);
        const units = parseFloat(detail.units || 0);

        updateDetail(detail.id, detail.name, price, units, record.id).then((response) => {
            if (!response.ok) {
                errorSwal('Error al editar el detalle', `No se ha podido editar el detalle ${detail.name}`)
                return;
            }

            const updatedDetail = response.respuesta;

            const updatedDetails = completeDetails.map((d) =>
                d.id === updatedDetail.id ? updatedDetail : d
            );
            setCompleteDetails(updatedDetails);
            setTotalDetails(updatedDetails.reduce((sum, d) => sum + parseFloat(d.totalPrice || 0), 0));

            setEditingDetailId(null);
            setNewDetail(null);
            successSwal('Detalle actualizado', 'El detalle se ha actualizado con éxito.');
        });
    };

    const makeEditDetail = (detail) => {
        setEditingDetailId(detail.id);
        setNewDetail({ ...detail });
    };

    const makeDeleteDetail = (id) => {
        Swal.fire({
            title: '¿Deseas eliminar el detalle?',
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
                deleteDetail(id).then((response) => {
                    if (!response.ok) {
                        errorSwal('Error al eliminar el detalle', 'No se ha podido eliminar el detalle');
                        return;
                    }

                    const updatedDetails = completeDetails.filter(d => d.id !== id);
                    setCompleteDetails(updatedDetails);

                    setRecord(prev => ({
                        ...prev,
                        details: prev.details.filter(detailId => detailId !== id)
                    }));

                    setTotalDetails(
                        updatedDetails.reduce((sum, d) => sum + parseFloat(d.totalPrice || 0), 0)
                    );

                    successSwal('Detalle eliminado', 'El detalle se eliminó correctamente.');
                });
            }
        });
    };

    const cancelNewDetail = () => {
        setNewDetail(null);
    }

    const cancelEditDetail = () => {
        setEditingDetailId(null);
        setNewDetail(null);
    }

    const isDetailValid = (detail) =>
        detail &&
        detail.name?.trim() &&
        !isNaN(parseFloat(detail.pricePerUnit)) &&
        !isNaN(parseFloat(detail.units));


    return (
        <>
            <div className="subheaderStyle d-flex justify-content-between align-items-center">
                <div className="ms-2">
                    {!recordIdByParam ? 'Nuevo' : 'Detalle de'} registro
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
                        recordIdByParam ? (
                            isButtonMobile ? (
                                <>
                                    <div>
                                        <button className="me-2 subheaderButton subheaderIndividualButtonOnlyIcon" disabled={editMode || loading}
                                                onClick={createNewRecord}>
                                            <FontAwesomeIcon icon={['fas', 'plus']} className="fa-sm"/>
                                        </button>
                                    </div>
                                    <div>
                                        <button className="me-2 btn btn-secondary subheaderIndividualButtonOnlyIcon" disabled={editMode || !isOwner || loading}
                                                onClick={() => setEditMode(true)}>
                                            <FontAwesomeIcon icon={['fas', 'pen']} className="fa-sm"/>
                                        </button>
                                    </div>
                                    <div>
                                        <button className="me-2 btn btn-danger subheaderIndividualButtonOnlyIcon"
                                                disabled={editMode || !isOwner || loading} onClick={makeDeleteRecord}>
                                            <FontAwesomeIcon icon={['fas', 'trash']} className="fa-sm"/>
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <button className="me-3 subheaderButton subheaderIndividualButton" disabled={editMode || loading}
                                                onClick={createNewRecord}>
                                            <FontAwesomeIcon icon={['fas', 'plus']} className="me-2 fa-sm"/>
                                            Crear
                                        </button>
                                    </div>
                                    <div>
                                        <button className="me-3 btn btn-secondary subheaderIndividualButton" style={{fontSize: '0.9rem'}} disabled={editMode || !isOwner || loading}
                                                onClick={() => setEditMode(true)}>
                                            <FontAwesomeIcon icon={['fas', 'pen']} className="me-2 fa-sm"/>
                                            Modificar
                                        </button>
                                    </div>
                                    <div>
                                        <button className="me-3 btn btn-danger subheaderIndividualButton" style={{fontSize: '0.9rem'}}
                                                disabled={editMode || !isOwner || loading} onClick={makeDeleteRecord}>
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
                            {errorInitialRecord && (
                                <span className="alert alert-danger p-1 ps-4 pe-4 mb-1 mt-1 w-95 text-center">
                            <FontAwesomeIcon icon={['fas', 'triangle-exclamation']} className="me-2"/>
                                    {errorInitialRecord}
                        </span>
                            )}
                            {errorInitialBudgets && (
                                <span className="alert alert-danger p-1 ps-4 pe-4 mb-1 mt-1 w-95 text-center">
                            <FontAwesomeIcon icon={['fas', 'triangle-exclamation']} className="me-2"/>
                                    {errorInitialBudgets}
                        </span>
                            )}
                        </div>
                        <div className={`d-flex flex-column align-items-center ${isMenuMobile ? 'mt-3' : (errorInitialRecord || errorInitialBudgets) ? 'mt-3' : 'mt-5'}`}>
                            <div className="appSection d-flex flex-wrap mb-5 p-3">
                        <span className="appTableTitle mt-0">
                            Datos:
                        </span>
                                <form onSubmit={saveRecord}>
                                    <div className="d-flex flex-wrap mt-2">
                                        <div className="filterDiv">
                                            <label className="filterLabel">Tipo:</label>
                                            <select
                                                className="filterInput appInput form-select"
                                                value={record.type}
                                                disabled={!editMode}
                                                onChange={(e) => setRecord({ ...record, type: e.target.value })}
                                            >
                                                <option value="EXPENSE">Gasto</option>
                                                <option value="INCOME">Ingreso</option>
                                            </select>
                                        </div>

                                        <div className="filterDiv">
                                            <label className="filterLabel">Nombre:</label>
                                            <input
                                                type="text"
                                                className="filterInput appInput form-control"
                                                disabled={!editMode}
                                                value={record.name}
                                                onChange={(e) => setRecord({ ...record, name: e.target.value })}
                                            />
                                        </div>

                                        <div className="filterDiv">
                                            <label className="filterLabel">Importe:</label>
                                            {editMode ? (
                                                <input type="number" step="0.01" className="filterInput appInput form-control text-end"
                                                       value={record.money} onChange={(e) => setRecord({ ...record, money: e.target.value })}/>
                                            ) : (
                                                <div className="form-control text-end filterInput appInput pe-4" style={{ background: '#e9ecef' }}>
                                                    {formatNumber(record.money)}
                                                </div>
                                            )}
                                        </div>

                                        <div className="filterDiv">
                                            <label className="filterLabel">Fecha:</label>
                                            <input
                                                type="date"
                                                className="filterInput appInput form-control text-end"
                                                disabled={!editMode}
                                                value={record.date}
                                                onChange={(e) => setRecord({ ...record, date: e.target.value })}
                                            />
                                        </div>

                                        <div className="filterDiv w-100">
                                            <label className="filterLabel">Presupuestos:</label>
                                            {!editMode ? (
                                                <div className="filterInput align-items-center p-0">
                                                    {record.budgets.length ? (
                                                        record.budgets.map((budgetId) => {
                                                            const budget = budgetMap.get(budgetId);
                                                            if (!budget) return null;

                                                            return (
                                                                <span key={budgetId} className="badge bg-transparent border border-success text-success me-2 p-2">
                                                            {budget.name}
                                                        </span>
                                                            );
                                                        })
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            className="filterInput appInput form-control"
                                                            disabled={!editMode}
                                                            value='No hay presupuestos asociados'
                                                        />
                                                    )}
                                                </div>
                                            ) : (
                                                !budgets.length ? (
                                                    <div className="filterInput align-items-center p-0 disabledDropdown">
                                                            <input
                                                                type="text"
                                                                className="filterInput appInput form-control"
                                                                disabled={true}
                                                                value='No hay presupuestos'
                                                            />
                                                    </div>
                                                ) : (
                                                <Dropdown className={`filterInput appInput ${(!editMode || !budgets.length) ? 'disabledDropdown' : ''}`} autoClose="outside" align="start">
                                                    <Dropdown.Toggle
                                                        as="div"
                                                        className={`dropdownInputToggle d-flex justify-content-between align-items-center ${(!editMode || !budgets.length) ? 'disabledDropdown' : ''}`}
                                                        style={{ backgroundColor: "white", cursor: "pointer" }}
                                                        disabled={!budgets.length}
                                                    >
                                                    <span>
                                                        {
                                                            record.budgets.length === budgets.length && record.budgets.length !== 1
                                                                ? "Todos seleccionados"
                                                                : record.budgets.length === 1
                                                                    ? budgets.find(b => b.id === record.budgets[0])?.name || "1 seleccionado"
                                                                    : record.budgets.length > 1
                                                                        ? `${record.budgets.length} seleccionados`
                                                                        : "Seleccionar presupuestos"
                                                        }
                                                    </span>
                                                    </Dropdown.Toggle>
                                                    <Dropdown.Menu className="w-100">
                                                        <Dropdown.Item
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                const allSelected = record.budgets.length === budgets.length;
                                                                setRecord({
                                                                    ...record,
                                                                    budgets: allSelected ? [] : budgets.map(b => b.id)
                                                                });
                                                            }}
                                                        >
                                                            <div className="d-flex justify-content-between align-items-center">
                                                                <span>Seleccionar todos</span>
                                                                {record.budgets.length === budgets.length && (
                                                                    <FontAwesomeIcon icon={['fas', 'check']} className="ms-1" />
                                                                )}
                                                            </div>
                                                        </Dropdown.Item>
                                                        <Dropdown.Divider />
                                                        {budgets.map(budget => {
                                                            const isSelected = record.budgets.includes(budget.id);

                                                            return (
                                                                <Dropdown.Item
                                                                    key={budget.id}
                                                                    onClick={(e) => {
                                                                        e.preventDefault();

                                                                        const updatedBudgets = isSelected
                                                                            ? record.budgets.filter(id => id !== budget.id)
                                                                            : [...record.budgets, budget.id];

                                                                        setRecord({ ...record, budgets: updatedBudgets });
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
                                            ))}

                                        </div>

                                        <div className="filterDiv">
                                            <label className="filterLabel">Comentario:</label>
                                            <input
                                                type="text"
                                                className="filterInput appInput form-control"
                                                disabled={!editMode}
                                                value={record.comment}
                                                onChange={(e) => setRecord({ ...record, comment: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    {
                                        editMode && (
                                            <div className="d-flex justify-content-between text-center me-3 mt-3">
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
                                                    <button className={`btn btn-primary appIndButton ${!recordIdByParam ? 'me-3' : ''}`} style={{width:'115px'}}>
                                                        <FontAwesomeIcon icon={['fas', !recordIdByParam && editMode ? 'save' : 'pen']} />
                                                        <span className="ms-2">{!recordIdByParam && editMode ? 'Guardar' : 'Editar'}</span>
                                                    </button>
                                                    {
                                                        recordIdByParam &&
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
                                </form>
                            </div>
                            {
                                record.id && (
                                    isTableMobile ? (
                                        <div className="w-95 mx-auto">
                                            <div className="budget-header-mobile mb-3 d-flex justify-content-between align-items-center flex-wrap px-3 py-2">
                                                <h5 className="text-start m-0 ms-1 flex-grow-1 text-start">Detalles del registro</h5>
                                                {(record.details.length > 0 && isOwner) && (
                                                    <button className="btn btn-warning appIndButton mt-2 mt-sm-0 ms-sm-3" onClick={makeNewDetail}>
                                                        <FontAwesomeIcon icon={['fas', 'receipt']} />
                                                        <span className="ms-2">Añadir detalle</span>
                                                    </button>
                                                )}
                                            </div>

                                            {(newDetail && !editingDetailId) && (
                                                <div className="budget-card-mobile mb-3">
                                                    <div className="budget-card-body d-flex flex-column gap-2">
                                                        <div className="d-flex align-items-center gap-2 mb-2">
                                                            <strong className="me-2">Nombre:</strong>
                                                            <input className="form-control cardInputs" value={newDetail.name}
                                                                   onChange={(e) => setNewDetail({ ...newDetail, name: e.target.value })}
                                                            />
                                                        </div>
                                                        <div className="d-flex align-items-center gap-2 mb-2">
                                                            <strong className="me-4">Precio:</strong>
                                                            <input type="number" min="0" step="0.01" className="form-control text-end cardInputs"
                                                                   value={newDetail.pricePerUnit}
                                                                   onChange={(e) => {
                                                                       const parsed = parseFloat(e.target.value);
                                                                       if (!isNaN(parsed)) {
                                                                           const units = parseInt(newDetail.units || 0, 10);
                                                                           setNewDetail({ ...newDetail, pricePerUnit: parsed, totalPrice: +(parsed * units).toFixed(2) });
                                                                       }
                                                                   }}
                                                                   onBlur={(e) => {
                                                                       const parsed = parseFloat(e.target.value);
                                                                       if (!isNaN(parsed)) {
                                                                           setNewDetail((prev) => ({ ...prev, pricePerUnit: +parsed.toFixed(2) }));
                                                                       }
                                                                   }}
                                                            />
                                                        </div>
                                                        <div className="d-flex align-items-center gap-2 mb-2">
                                                            <strong>Unidades:</strong>
                                                            <input type="number" min="0" step="1" className="form-control text-end cardInputs"
                                                                   value={newDetail.units}
                                                                   onChange={(e) => {
                                                                       const parsed = parseFloat(e.target.value);
                                                                       if (!isNaN(parsed)) {
                                                                           const rounded = Math.round(parsed);
                                                                           const price = parseFloat(newDetail.pricePerUnit || 0);
                                                                           setNewDetail({ ...newDetail, units: rounded, totalPrice: +(price * rounded).toFixed(2) });
                                                                       }
                                                                   }}
                                                                   onBlur={(e) => {
                                                                       const parsed = parseFloat(e.target.value);
                                                                       if (!isNaN(parsed)) {
                                                                           const rounded = Math.round(parsed);
                                                                           const price = parseFloat(newDetail.pricePerUnit || 0);
                                                                           setNewDetail({ ...newDetail, units: rounded, totalPrice: +(price * rounded).toFixed(2) });
                                                                       }
                                                                   }}
                                                            />
                                                        </div>
                                                        <div className="text-end mt-1">
                                                            <strong className="me-2">Total:</strong> {formatNumber(newDetail.totalPrice)}
                                                        </div>
                                                    </div>
                                                    <div className="budget-card-actions mt-2">
                                                        <button className="btn btn-primary appTableButton" disabled={!isDetailValid(newDetail)} onClick={() => saveNewDetail(newDetail)}>Guardar</button>
                                                        <button className="btn btn-secondary appTableButton ms-2" onClick={cancelNewDetail}>Cancelar</button>
                                                    </div>
                                                </div>
                                            )}

                                            {!loadingDetails && completeDetails.length > 0 && (
                                                completeDetails.map((detail) => (
                                                    detail.id === editingDetailId ? (
                                                        <div key={detail.id} className="budget-card-mobile mb-3">
                                                            <div className="budget-card-body d-flex flex-column gap-2">
                                                                <div className="d-flex align-items-center gap-2 mb-2">
                                                                    <strong className="me-2">Nombre:</strong>
                                                                    <input className="form-control cardInputs" value={newDetail.name}
                                                                           onChange={(e) => setNewDetail({ ...newDetail, name: e.target.value })}
                                                                    />
                                                                </div>
                                                                <div className="d-flex align-items-center gap-2 mb-2">
                                                                    <strong className="me-4">Precio:</strong>
                                                                    <input type="number" min="0" step="0.01" className="form-control text-end cardInputs"
                                                                           value={newDetail.pricePerUnit}
                                                                           onChange={(e) => {
                                                                               const parsed = parseFloat(e.target.value);
                                                                               if (!isNaN(parsed)) {
                                                                                   const units = parseInt(newDetail.units || 0, 10);
                                                                                   setNewDetail({ ...newDetail, pricePerUnit: parsed, totalPrice: +(parsed * units).toFixed(2) });
                                                                               }
                                                                           }}
                                                                           onBlur={(e) => {
                                                                               const parsed = parseFloat(e.target.value);
                                                                               if (!isNaN(parsed)) {
                                                                                   setNewDetail((prev) => ({ ...prev, pricePerUnit: +parsed.toFixed(2) }));
                                                                               }
                                                                           }}
                                                                    />
                                                                </div>
                                                                <div className="d-flex align-items-center gap-2 mb-2">
                                                                    <strong>Unidades:</strong>
                                                                    <input type="number" min="0" step="1" className="form-control text-end cardInputs"
                                                                           value={newDetail.units}
                                                                           onChange={(e) => {
                                                                               const parsed = parseFloat(e.target.value);
                                                                               if (!isNaN(parsed)) {
                                                                                   const rounded = Math.round(parsed);
                                                                                   const price = parseFloat(newDetail.pricePerUnit || 0);
                                                                                   setNewDetail({ ...newDetail, units: rounded, totalPrice: +(price * rounded).toFixed(2) });
                                                                               }
                                                                           }}
                                                                           onBlur={(e) => {
                                                                               const parsed = parseFloat(e.target.value);
                                                                               if (!isNaN(parsed)) {
                                                                                   const rounded = Math.round(parsed);
                                                                                   const price = parseFloat(newDetail.pricePerUnit || 0);
                                                                                   setNewDetail({ ...newDetail, units: rounded, totalPrice: +(price * rounded).toFixed(2) });
                                                                               }
                                                                           }}
                                                                    />
                                                                </div>
                                                                <div className="text-end mt-1 me-3">
                                                                    <strong className="me-2">Total:</strong> {formatNumber(newDetail.totalPrice)}
                                                                </div>
                                                            </div>
                                                            <div className="budget-card-actions mt-2">
                                                                <button className="btn btn-primary appTableButton" disabled={!isDetailValid(newDetail)} onClick={() => saveEditDetail(newDetail)}>Guardar</button>
                                                                <button className="btn btn-secondary appTableButton ms-2" onClick={cancelEditDetail}>Cancelar</button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div key={detail.id} className="budget-card-mobile mb-3">
                                                            <div className="budget-card-header">
                                                                <h5>{detail.name}</h5>
                                                            </div>
                                                            <div className="budget-card-body">
                                                                <div className="budget-info-item"><strong className="me-2">Precio Ud:</strong>{formatNumber(detail.pricePerUnit)}</div>
                                                                <div className="budget-info-item"><strong className="me-2">Unidades:</strong>{formatInteger(detail.units)}</div>
                                                                <div className="budget-info-item"><strong className="me-2">Total:</strong>{formatNumber(detail.totalPrice)}</div>
                                                            </div>
                                                            {isOwner && (
                                                                <div className="budget-card-actions">
                                                                    <button className="btn btn-secondary appTableButton" onClick={() => makeEditDetail(detail)}>Editar</button>
                                                                    <button className="btn btn-danger appTableButton ms-2" onClick={() => makeDeleteDetail(detail.id)}>Eliminar</button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                ))
                                            )}

                                            {!loadingDetails && completeDetails.length === 0 && !newDetail && (
                                                <div className="alert alert-warning text-center p-3">
                                                    <p className="mb-3">No tienes detalles para este registro. Crea uno pulsando en el botón:</p>
                                                    {isOwner && (
                                                        <button className="btn btn-warning appIndButton" onClick={makeNewDetail}>
                                                            <FontAwesomeIcon icon={['fas', 'receipt']} />
                                                            <span className="ms-2">Añadir detalle</span>
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <div className="d-flex justify-content-between align-items-center w-95">
                                                <span className="w-95 text-start mb-3 appTableTitle">Detalles del registro:</span>
                                                {
                                                    (record.details.length > 0 && isOwner) && (
                                                        <button className="btn btn-warning appIndButton mb-2 me-2" style={{minWidth:'175px'}} onClick={makeNewDetail} >
                                                            <FontAwesomeIcon icon={['fas', 'receipt']} />
                                                            <span className="ms-2">Añadir detalle</span>
                                                        </button>
                                                    )
                                                }
                                            </div>
                                            <div className="appTableContainer">
                                                <table className="table table-hover table-bordered appTable">
                                                    <thead className="appTableHeader">
                                                    <tr>
                                                        <th style={{width: '30%'}}>
                                                            Nombre
                                                        </th>
                                                        <th className="text-center" style={{width: '18%'}}>
                                                            Precio Ud.
                                                        </th>
                                                        <th className="text-center" style={{width: '18%'}}>
                                                            Unidades
                                                        </th>
                                                        <th className="text-center" style={{width: '18%'}}>
                                                            Total
                                                        </th >
                                                        <th className="text-center" style={isLineButtonsInTable ? {} : { minWidth: '225px' }}>
                                                        </th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {(newDetail && !editingDetailId) && (
                                                        <tr>
                                                            <td>
                                                                <input className="form-control" value={newDetail.name}
                                                                       onChange={(event) =>
                                                                           setNewDetail({ ...newDetail, name: event.target.value })
                                                                       }
                                                                />
                                                            </td>
                                                            <td>
                                                                <input type="number" min="0" step="0.01" className="form-control text-end"
                                                                       value={newDetail.pricePerUnit}
                                                                       onChange={(event) => {
                                                                           const inputValue = event.target.value;
                                                                           const parsedPrice = parseFloat(inputValue);

                                                                           if (isNaN(parsedPrice)) return;

                                                                           setNewDetail((prev) => {
                                                                               const units = parseInt(prev.units || 0, 10);
                                                                               return {
                                                                                   ...prev,
                                                                                   pricePerUnit: parsedPrice,
                                                                                   totalPrice: +(parsedPrice * units).toFixed(2)
                                                                               };
                                                                           });
                                                                       }}
                                                                       onBlur={(event) => {
                                                                           const parsedPrice = parseFloat(event.target.value);
                                                                           if (isNaN(parsedPrice)) return;

                                                                           setNewDetail((prev) => ({
                                                                               ...prev,
                                                                               pricePerUnit: +parsedPrice.toFixed(2)
                                                                           }));
                                                                       }}
                                                                />
                                                            </td>
                                                            <td>
                                                                <input type="number" min="0" step="1" className="form-control text-end" value={newDetail.units}
                                                                       onChange={(event) => {
                                                                           const inputValue = event.target.value;
                                                                           const parsedValue = parseFloat(inputValue);

                                                                           if (isNaN(parsedValue)) return;

                                                                           const roundedUnits = Math.round(parsedValue);
                                                                           const price = parseFloat(newDetail.pricePerUnit || 0);

                                                                           setNewDetail({
                                                                               ...newDetail,
                                                                               units: roundedUnits,
                                                                               totalPrice: +(price * roundedUnits).toFixed(2)
                                                                           });
                                                                       }}
                                                                       onBlur={(event) => {
                                                                           const parsedValue = parseFloat(event.target.value);

                                                                           if (isNaN(parsedValue)) return;

                                                                           const roundedUnits = Math.round(parsedValue);
                                                                           const price = parseFloat(newDetail.pricePerUnit || 0);

                                                                           setNewDetail({
                                                                               ...newDetail,
                                                                               units: roundedUnits,
                                                                               totalPrice: +(price * roundedUnits).toFixed(2)
                                                                           });
                                                                       }}
                                                                />
                                                            </td>
                                                            <td className="text-end pe-4 align-middle">
                                                                {formatNumber(newDetail.totalPrice)}
                                                            </td>
                                                            <td className="text-center align-middle">
                                                                <div className="d-flex justify-content-center">
                                                                    <button className="btn btn-primary appTableButton m-1" disabled={!isDetailValid(newDetail)}
                                                                            onClick={() => saveNewDetail(newDetail)}>
                                                                        Guardar
                                                                    </button>
                                                                    <button className="btn btn-secondary appTableButton m-1"
                                                                            onClick={() => cancelNewDetail()}>
                                                                        Cancelar
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                    {(!loadingDetails && (completeDetails.length > 0 || (newDetail && !editingDetailId))) ? (
                                                        completeDetails.map((detail) => (
                                                            detail.id === editingDetailId ? (
                                                                <tr key={detail.id}>
                                                                    <td>
                                                                        <input
                                                                            className="form-control"
                                                                            value={newDetail.name}
                                                                            onChange={(e) =>
                                                                                setNewDetail({ ...newDetail, name: e.target.value })
                                                                            }
                                                                        />
                                                                    </td>
                                                                    <td>
                                                                        <input type="number" min="0" step="0.01" className="form-control text-end"
                                                                               value={newDetail.pricePerUnit}
                                                                               onChange={(event) => {
                                                                                   const inputValue = event.target.value;
                                                                                   const parsedPrice = parseFloat(inputValue);

                                                                                   if (isNaN(parsedPrice)) return;

                                                                                   setNewDetail((prev) => {
                                                                                       const units = parseInt(prev.units || 0, 10);
                                                                                       return {
                                                                                           ...prev,
                                                                                           pricePerUnit: parsedPrice,
                                                                                           totalPrice: +(parsedPrice * units).toFixed(2)
                                                                                       };
                                                                                   });
                                                                               }}
                                                                               onBlur={(event) => {
                                                                                   const parsedPrice = parseFloat(event.target.value);
                                                                                   if (isNaN(parsedPrice)) return;

                                                                                   setNewDetail((prev) => ({
                                                                                       ...prev,
                                                                                       pricePerUnit: +parsedPrice.toFixed(2)
                                                                                   }));
                                                                               }}
                                                                        />
                                                                    </td>
                                                                    <td>
                                                                        <input type="number" min="0" step="1" className="form-control text-end" value={newDetail.units}
                                                                               onChange={(event) => {
                                                                                   const inputValue = event.target.value;
                                                                                   const parsedValue = parseFloat(inputValue);

                                                                                   if (isNaN(parsedValue)) return;

                                                                                   const roundedUnits = Math.round(parsedValue);
                                                                                   const price = parseFloat(newDetail.pricePerUnit || 0);

                                                                                   setNewDetail({
                                                                                       ...newDetail,
                                                                                       units: roundedUnits,
                                                                                       totalPrice: +(price * roundedUnits).toFixed(2)
                                                                                   });
                                                                               }}
                                                                               onBlur={(event) => {
                                                                                   const parsedValue = parseFloat(event.target.value);

                                                                                   if (isNaN(parsedValue)) return;

                                                                                   const roundedUnits = Math.round(parsedValue);
                                                                                   const price = parseFloat(newDetail.pricePerUnit || 0);

                                                                                   setNewDetail({
                                                                                       ...newDetail,
                                                                                       units: roundedUnits,
                                                                                       totalPrice: +(price * roundedUnits).toFixed(2)
                                                                                   });
                                                                               }}
                                                                        />
                                                                    </td>
                                                                    <td className="text-end pe-4 align-middle">
                                                                        {formatNumber(newDetail.totalPrice)}
                                                                    </td>
                                                                    <td className="text-center align-middle">
                                                                        <div className="d-flex justify-content-center">
                                                                            <button className="btn btn-primary appTableButton" disabled={!isDetailValid(newDetail)}
                                                                                    onClick={() => saveEditDetail(newDetail)}>
                                                                                Guardar
                                                                            </button>
                                                                            <button className="btn btn-secondary appTableButton ms-2" onClick={cancelEditDetail}>
                                                                                Cancelar
                                                                            </button>
                                                                        </div>

                                                                    </td>
                                                                </tr>
                                                            ) : (
                                                                <tr key={detail.id}>
                                                                    <td>
                                                                        {detail.name}
                                                                    </td>
                                                                    <td className="text-end pe-4">
                                                                        {formatNumber(detail.pricePerUnit)}
                                                                    </td>
                                                                    <td className="text-end pe-4">
                                                                        {formatInteger(detail.units)}
                                                                    </td>
                                                                    <td className="text-end pe-4">
                                                                        {formatNumber(detail.totalPrice)}
                                                                    </td>
                                                                    <td className="text-center" style={{minWidth: '12.5rem'}}>
                                                                        {
                                                                            isOwner && (
                                                                                <>
                                                                                    <button className="btn btn-secondary appTableButton"
                                                                                            onClick={() => makeEditDetail(detail)}>
                                                                                        Editar
                                                                                    </button>
                                                                                    <button className="btn btn-danger appTableButton ms-2"
                                                                                            onClick={() => makeDeleteDetail(detail.id)}>
                                                                                        Eliminar
                                                                                    </button>
                                                                                </>
                                                                            )
                                                                        }
                                                                    </td>
                                                                </tr>
                                                            )
                                                        ))
                                                    ) : (
                                                        !loadingDetails && (<tr>
                                                            <td colSpan="7" className="p-0 m-0">
                                                                <div className="m-0 p-0 d-flex flex-column align-items-center text-center"
                                                                     style={{ backgroundColor: '#fff3cd' }}>
                                                            <span className="mt-4 mb-4">
                                                                No tienes detalles para este registro. Crea uno pulsando en el botón
                                                            </span>
                                                                    {
                                                                        isOwner && (
                                                                            <button className="btn btn-warning mb-4 appIndButton" onClick={makeNewDetail}>
                                                                                <FontAwesomeIcon icon={['fas', 'receipt']} />
                                                                                <span className="ms-2">Añadir detalle</span>
                                                                            </button>
                                                                        )
                                                                    }
                                                                </div>
                                                            </td>
                                                        </tr>)
                                                    )}
                                                    {completeDetails.length > 0 && (
                                                        <tr>
                                                            <td className="text-end" colSpan="3">
                                                                <span className="fw-bold">Suma detalle:</span>
                                                            </td>
                                                            <td className="text-end pe-4">
                                                                <span className="fw-bold">{formatNumber(totalDetails)}</span>
                                                            </td>
                                                            <td></td>
                                                        </tr>
                                                    )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </>
                                    )
                                )
                            }
                        </div>
                    </>
                )
            }
        </>
    )
}

export default RecordIndividual;
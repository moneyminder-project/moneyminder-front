import {useTitleWithAppName} from "../../hooks/commonHooks/useTitle.jsx";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import React, {useEffect, useState} from "react";
import {deleteRecord, getRecords} from "../../serviceApiCalls/RecordApiService.jsx";
import {formatDate, formatNumber} from "../../utils/Formatters.jsx";
import {RecordType} from "../../utils/RecordTypeEnum.jsx";
import {getBudgets} from "../../serviceApiCalls/BudgetApiService.jsx";
import {Dropdown} from "react-bootstrap";
import {useNavigate} from "react-router-dom";
import Swal from "sweetalert2";
import {errorSwal, successSwal} from "../../utils/SwalUtils.jsx";
import Loading from "../loading/Loading.jsx";
import {useIsLineButtonsInTable, useIsMenuMobile, useIsTableMobile} from "../../hooks/responsiveHooks.jsx";

function Records() {
    useTitleWithAppName("Ingresos y gastos");
    const navigate = useNavigate();
    const [records, setRecords] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [budgetMap, setBudgetMap] = useState(new Map());
    const [params, setParams] = useState({});
    const [form, setForm] = useState({
        type: '',
        minAmount: '',
        maxAmount: '',
        budgets: [],
        startDate: '',
        endDate: '',
        name: '',
        comment: ''
    });
    const [errorInitialRecords, setErrorInitialRecords] = useState(null);
    const [errorInitialBudgets, setErrorInitialBudgets] = useState(null);
    const [loading, setLoading] = useState(false);
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
        setErrorInitialRecords(null);
        setErrorInitialBudgets(null);

        const fetchData = async () => {
            try {

                const[recordsResponse, budgetsResponse] = await  Promise.all([
                    getRecords(params),
                    getBudgets()
                ]);

                if (recordsResponse?.ok) {
                    setRecords(recordsResponse.respuesta || []);
                } else {
                    setRecords([]);
                    setErrorInitialRecords('No se han podido obtener los registros del usuario.');
                }

                setRecords(recordsResponse.ok ? (recordsResponse.respuesta || []) : []);

                if (budgetsResponse?.ok) {
                    const budgetsData = budgetsResponse.respuesta || [];
                    setBudgets(budgetsData);

                    const map = new Map();
                    budgetsData.forEach(budget => {
                        map.set(budget.id, budget);
                    });
                    setBudgetMap(map);
                } else {
                    setErrorInitialBudgets('No se han podido obtener los presupuestos del usuario.');
                }

                setLoading(false);

            } catch (error) {
                console.log('Error al obtener los datos iniciales');
                setLoading(false);
            }
        }

        fetchData();
    }, [])

    const retrieveRecords = (event) => {
        event.preventDefault();

        const newParams = {};

        if (form.type) newParams.recordType = form.type;

        if (form.minAmount) {
            const min = parseFloat(form.minAmount);
            newParams.moneyGreaterOrEqualThan = min;

            if (form.maxAmount) {
                const max = parseFloat(form.maxAmount);
                newParams.moneyLowerOrEqualThan = max < min ? min : max;
            }
        } else if (form.maxAmount) {
            newParams.moneyLowerOrEqualThan = parseFloat(form.maxAmount);
        }

        if (form.budgets.length > 0) {
            newParams.budgetsIn = form.budgets;
        }

        if (form.startDate) {
            newParams.dateAfterOrEqualThan = form.startDate;

            if (form.endDate) {
                newParams.dateBeforeOrEqualThan =
                    form.endDate < form.startDate ? form.startDate : form.endDate;
            }
        } else if (form.endDate) {
            newParams.dateBeforeOrEqualThan = form.endDate;
        }

        if (form.name) newParams.name = form.name;
        if (form.comment) newParams.comment = form.comment;

        setParams(newParams);

        getRecords(newParams).then((response) => {
            if (!response.ok) {
                setRecords([]);
                return;
            }

            setRecords(response.respuesta || []);
        });
    };

    const cleanFilters = (event) => {
        event.preventDefault();

        setParams({});

        setForm({
            type: '',
            minAmount: '',
            maxAmount: '',
            budgets: [],
            startDate: '',
            endDate: '',
            name: '',
            comment: ''
        });

        getRecords().then((response) => {
            if (!response.ok) {
                setRecords([]);
                return;
            }

            setRecords(response.respuesta || []);
        });
    }

    const makeDeleteRecord = async (record) => {
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

        if (!result.isConfirmed) return;

        deleteRecord(record.id).then((response) => {
            if (!response.ok) {
                errorSwal('Error al eliminar el registro', 'No se ha podido eliminar el registro');
                return;
            }

            setRecords(prev => prev.filter(r => r.id !== record.id));
            successSwal('Registro eliminado', 'El registro se ha eliminado con éxito.');
        });
    };

    return (
        <>
            <div className="subheaderStyle d-flex justify-content-between align-items-center">
                <div className="ms-2">
                    Registros
                </div>
                <div>
                    <button className="me-3 subheaderButton" onClick={() => gotoRegister()} disabled={loading}>
                        <FontAwesomeIcon icon={['fas', 'plus']} className="me-2 fa-sm"/>
                        Añadir registro
                    </button>
                </div>
            </div>
            {
                loading ? (
                    <Loading></Loading>
                ) : (
                    <>
                        <div className={`d-flex flex-column align-items-center ${!isMenuMobile && 'mt-4'}`}>
                            {errorInitialRecords && (
                                <span className="alert alert-danger p-1 ps-4 pe-4 mb-1 mt-1 w-95 text-center">
                            <FontAwesomeIcon icon={['fas', 'triangle-exclamation']} className="me-2"/>
                                    {errorInitialRecords}
                        </span>
                            )}
                            {errorInitialBudgets && (
                                <span className="alert alert-danger p-1 ps-4 pe-4 mb-1 mt-1 w-95 text-center">
                            <FontAwesomeIcon icon={['fas', 'triangle-exclamation']} className="me-2"/>
                                    {errorInitialBudgets}
                        </span>
                            )}
                        </div>
                        <div className={`d-flex flex-column align-items-center ${isMenuMobile ? 'mt-3' : (errorInitialRecords || errorInitialBudgets) ? 'mt-3' : 'mt-5'}`}>
                            <div className="appSection d-flex flex-wrap mb-5 p-3">
                        <span className="appTableTitle mt-0">
                            Filtros:
                        </span>
                                <form onSubmit={retrieveRecords}>
                                    <div className="d-flex flex-wrap mt-2">
                                        <div className="filterDiv">
                                            <label className="filterLabel">Tipo:</label>
                                            <select
                                                className="filterInput appInput form-select"
                                                value={form.type}
                                                onChange={(e) => setForm({ ...form, type: e.target.value })}
                                            >
                                                <option value="">Todos</option>
                                                <option value="EXPENSE">Gasto</option>
                                                <option value="INCOME">Ingreso</option>
                                            </select>
                                        </div>

                                        <div className="filterDiv">
                                            <label className="filterLabel">Importe mínimo:</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="filterInput appInput form-control text-end"
                                                value={form.minAmount}
                                                onChange={(e) => setForm({ ...form, minAmount: e.target.value })}
                                            />
                                        </div>

                                        <div className="filterDiv">
                                            <label className="filterLabel">Importe máximo:</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min={form.minAmount || undefined}
                                                className="filterInput appInput form-control text-end"
                                                value={form.maxAmount}
                                                onChange={(e) => setForm({ ...form, maxAmount: e.target.value })}
                                                onBlur={(e) => {
                                                    const min = parseFloat(form.minAmount);
                                                    const max = parseFloat(e.target.value);

                                                    if (!isNaN(min) && !isNaN(max) && max < min) {
                                                        setForm({ ...form, maxAmount: form.minAmount });
                                                    }
                                                }}
                                            />
                                        </div>

                                        <div className="filterDiv w-100">
                                            <label className="filterLabel">Presupuestos:</label>
                                            <Dropdown className="filterInput appInput" autoClose="outside" align="start">
                                                <Dropdown.Toggle
                                                    as="div"
                                                    className="dropdownInputToggle d-flex justify-content-between align-items-center"
                                                    style={{ backgroundColor: "white", cursor: "pointer" }}
                                                    disabled={!budgets.length}
                                                >
                                            <span>
                                                {
                                                    form.budgets.length === budgets.length
                                                        ? "Todos seleccionados"
                                                        : form.budgets.length === 1
                                                            ? budgets.find(b => b.id === form.budgets[0])?.name || "1 seleccionado"
                                                            : form.budgets.length > 1
                                                                ? `${form.budgets.length} seleccionados`
                                                                : "Seleccionar presupuestos"
                                                }
                                            </span>
                                                </Dropdown.Toggle>
                                                <Dropdown.Menu className="w-100">
                                                    <Dropdown.Item
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            const allSelected = form.budgets.length === budgets.length;
                                                            setForm({
                                                                ...form,
                                                                budgets: allSelected ? [] : budgets.map(b => b.id)
                                                            });
                                                        }}
                                                    >
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            <span>Seleccionar todos</span>
                                                            {form.budgets.length === budgets.length && (
                                                                <FontAwesomeIcon icon={['fas', 'check']} className="ms-1" />
                                                            )}
                                                        </div>
                                                    </Dropdown.Item>
                                                    <Dropdown.Divider />
                                                    {budgets.map(budget => {
                                                        const isSelected = form.budgets.includes(budget.id);

                                                        return (
                                                            <Dropdown.Item
                                                                key={budget.id}
                                                                onClick={(e) => {
                                                                    e.preventDefault();

                                                                    const updatedBudgets = isSelected
                                                                        ? form.budgets.filter(id => id !== budget.id)
                                                                        : [...form.budgets, budget.id];

                                                                    setForm({ ...form, budgets: updatedBudgets });
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
                                        </div>

                                        <div className="filterDiv">
                                            <label className="filterLabel">Fecha inicial:</label>
                                            <input
                                                type="date"
                                                className="filterInput appInput form-control text-end"
                                                value={form.startDate}
                                                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                                            />
                                        </div>

                                        <div className="filterDiv">
                                            <label className="filterLabel">Fecha final:</label>
                                            <input
                                                type="date"
                                                className="filterInput appInput form-control text-end"
                                                min={form.startDate || undefined}
                                                value={form.endDate}
                                                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                                                onBlur={() => {
                                                    if (form.startDate && form.endDate && form.endDate < form.startDate) {
                                                        setForm({ ...form, endDate: form.startDate });
                                                    }
                                                }}
                                            />
                                        </div>

                                        <div className="filterDiv">
                                            <label className="filterLabel">Nombre:</label>
                                            <input
                                                type="text"
                                                className="filterInput appInput form-control"
                                                value={form.name}
                                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            />
                                        </div>

                                        <div className="filterDiv">
                                            <label className="filterLabel">Descripción:</label>
                                            <input
                                                type="text"
                                                className="filterInput appInput form-control"
                                                value={form.comment}
                                                onChange={(e) => setForm({ ...form, comment: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="text-end me-3 mt-3">
                                        <button className="btn btn-primary appIndButton">
                                            <FontAwesomeIcon icon={['fas', 'filter']} />
                                            <span className="ms-2">Buscar registros</span>
                                        </button>
                                        <button className="btn btn-secondary appIndButton ms-3 me-3" onClick={cleanFilters}>
                                            <FontAwesomeIcon icon={['fas', 'broom']} />
                                            <span className="ms-2">Limpiar filtros</span>
                                        </button>
                                    </div>
                                </form>
                            </div>
                            {
                                isTableMobile ? (
                                    <div className="w-95 mx-auto">
                                        <div className="budget-header-mobile mb-3">
                                            <h5 className="text-center m-0">Gastos e ingresos</h5>
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
                                                            <div className="budget-info-item w-100">
                                                                <FontAwesomeIcon icon={['fas', 'comment']} className="me-2 fa-sm" />
                                                                <strong className="me-2">Comentario:</strong>{record.comment || '–'}
                                                            </div>
                                                            <div className="budget-info-item w-100">
                                                                <FontAwesomeIcon icon={['fas', 'folder-open']} className="me-2 fa-sm" />
                                                                <strong>Presupuestos:</strong>&nbsp;
                                                                {record.budgets.length > 0 ? (
                                                                    record.budgets.map((budgetId) => {
                                                                        const budget = budgetMap.get(budgetId);
                                                                        return budget ? (
                                                                            <span
                                                                                key={budgetId}
                                                                                className="badge bg-transparent border border-success text-success ms-1 me-1 p-2"
                                                                            >
                                                                            {budget.name}
                                                                        </span>
                                                                        ) : null;
                                                                    })
                                                                ) : (
                                                                    <span className="ms-1">Sin presupuestos</span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="budget-card-actions mt-3">
                                                            <button
                                                                className="btn btn-secondary appTableButton"
                                                                onClick={() => goToRegisterWithId(record.id)}
                                                            >
                                                                Detalle
                                                            </button>
                                                            <button
                                                                className="btn btn-danger appTableButton ms-4"
                                                                onClick={() => makeDeleteRecord(record)}
                                                            >
                                                                Eliminar
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="alert alert-warning text-center p-3">
                                                <p className="mb-0">No tienes registros para los criterios de búsqueda seleccionados.</p>
                                            </div>
                                        )}
                                    </div>

                                ) : (
                                    <>
                                        <span className="w-95 text-start mb-3 appTableTitle"> Gastos e ingresos:</span>
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
                                                    <th style={{width: '25%'}}>
                                                        Comentario
                                                    </th >
                                                    <th className="text-center" style={{width: '14%'}}>
                                                        Presupuestos
                                                    </th>
                                                    <th className="text-center" style={isLineButtonsInTable ? {} : { minWidth: '225px' }}>
                                                    </th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {
                                                    records.length ? (
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
                                                                <td>
                                                                    {record.comment}
                                                                </td>
                                                                <td className="text-center">
                                                                    {record.budgets.length ? (
                                                                        record.budgets.map((budgetId) => {
                                                                            const budget = budgetMap.get(budgetId);
                                                                            if (!budget) return null;

                                                                            return (
                                                                                <span key={budgetId} className="badge bg-transparent border border-success text-success ms-1 me-1 p-2">
                                                            {budget.name}
                                                        </span>
                                                                            );
                                                                        })
                                                                    ) : (
                                                                        <span>Sin presupuestos</span>
                                                                    )}
                                                                </td>
                                                                <td className="text-center">
                                                                    <button className="btn btn-secondary appTableButton m-1" onClick={() => goToRegisterWithId(record.id)}>Detalle</button>
                                                                    <button className="btn btn-danger appTableButton m-1" onClick={() => makeDeleteRecord(record)}>Eliminar</button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="7" className="p-0 m-0">
                                                                <div className="m-0 p-0 d-flex flex-column align-items-center text-center" style={{backgroundColor: '#fff3cd'}}>
                                                                    <span className="mt-4 mb-4">No tienes registros para los criterios de búsqueda seleccionados.</span>
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
    );
}

export default Records;

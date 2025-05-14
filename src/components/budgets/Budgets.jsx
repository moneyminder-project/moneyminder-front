import {useTitleWithAppName} from "../../hooks/commonHooks/useTitle.jsx";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import React, {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {formatDate, formatNumber} from "../../utils/Formatters.jsx";
import {deleteBudget, getBudgets} from "../../serviceApiCalls/BudgetApiService.jsx";
import Swal from "sweetalert2";
import {deleteRecord} from "../../serviceApiCalls/RecordApiService.jsx";
import {errorSwal, successSwal} from "../../utils/SwalUtils.jsx";
import Loading from "../loading/Loading.jsx";
import {useIsLineButtonsInTable, useIsMenuMobile, useIsTableMobile} from "../../hooks/responsiveHooks.jsx";

function Budgets() {
    useTitleWithAppName('Presupuesto');
    const navigate = useNavigate();
    const [budgets, setBudgets] = useState([]);
    const [params, setParams] = useState({});
    const [form, setForm] = useState({
        expensesLimitGreaterOrEqualThan: '',
        expensesLimitLowerOrEqualThan: '',
        startDateBeforeOrEqualThan: '',
        startDateAfterOrEqualThan: '',
        endDateBeforeOrEqualThan: '',
        endDateAfterOrEqualThan: '',
        name: '',
        favorite: ''
    });
    const [errorInitialData, setErrorInitialData] = useState(null);
    const [loading, setLoading] = useState(false);
    const isMenuMobile = useIsMenuMobile();
    const isTableMobile = useIsTableMobile();
    const isLineButtonsInTable = useIsLineButtonsInTable();

    useEffect(() => {
        setLoading(true);
        setErrorInitialData(null);
        getBudgets().then((response) => {
            if(!response.ok) {
                setBudgets([]);
                setErrorInitialData('No se han podido obtener los presupuestos del usuario');
                setLoading(false);
                return;
            }

            setBudgets(response.respuesta || []);
            setLoading(false);
        })
    }, [])


    const goToBudget = () => {
        navigate(`/budget`);
    }

    const goToBudgetWithId = (id) => {
        navigate(`/budget/${id}`);
    }

    const retrieveBudgets = (event) => {
        event.preventDefault();

        const newParams = {};

        if (form.name) newParams.name = form.name;

        if (form.expensesLimitGreaterOrEqualThan) {
            const min = parseFloat(form.expensesLimitGreaterOrEqualThan);
            newParams.expensesLimitGreaterOrEqualThan = min;

            if (form.expensesLimitLowerOrEqualThan) {
                const max = parseFloat(form.expensesLimitLowerOrEqualThan);
                newParams.expensesLimitLowerOrEqualThan = max < min ? min : max;
            }
        } else if (form.expensesLimitLowerOrEqualThan) {
            newParams.expensesLimitLowerOrEqualThan = parseFloat(form.expensesLimitLowerOrEqualThan);
        }

        if (form.startDateAfterOrEqualThan) {
            newParams.startDateAfterOrEqualThan = form.startDateAfterOrEqualThan;

            if (form.startDateBeforeOrEqualThan) {
                newParams.startDateBeforeOrEqualThan =
                    form.startDateBeforeOrEqualThan < form.startDateAfterOrEqualThan
                        ? form.startDateAfterOrEqualThan
                        : form.startDateBeforeOrEqualThan;
            }
        } else if (form.startDateBeforeOrEqualThan) {
            newParams.startDateBeforeOrEqualThan = form.startDateBeforeOrEqualThan;
        }

        if (form.endDateAfterOrEqualThan) {
            newParams.endDateAfterOrEqualThan = form.endDateAfterOrEqualThan;

            if (form.endDateBeforeOrEqualThan) {
                newParams.endDateBeforeOrEqualThan =
                    form.endDateBeforeOrEqualThan < form.endDateAfterOrEqualThan
                        ? form.endDateAfterOrEqualThan
                        : form.endDateBeforeOrEqualThan;
            }
        } else if (form.endDateBeforeOrEqualThan) {
            newParams.endDateBeforeOrEqualThan = form.endDateBeforeOrEqualThan;
        }

        if (form.favorite === true || form.favorite === false) {
            newParams.favorite = form.favorite;
        }

        setParams(newParams);

        getBudgets(newParams).then((response) => {
            if (!response.ok) {
                setBudgets([]);
                return;
            }

            setBudgets(response.respuesta || []);
        });
    };

    const cleanFilters = (event) => {
        event.preventDefault();

        setParams({});

        setForm({
            expensesLimitGreaterOrEqualThan: '',
            expensesLimitLowerOrEqualThan: '',
            startDateBeforeOrEqualThan: '',
            startDateAfterOrEqualThan: '',
            endDateBeforeOrEqualThan: '',
            endDateAfterOrEqualThan: '',
            name: '',
            favorite: ''
        });

        getBudgets().then((response) => {
            if (!response.ok) {
                setBudgets([]);
                return;
            }

            setBudgets(response.respuesta || []);
        });
    }

    const makeDeleteBudget = async (budget) => {
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

        if (!result.isConfirmed) return;

        deleteBudget(budget.id).then((response) => {
            if (!response.ok) {
                errorSwal('Error al eliminar el presupuesto', 'No se ha podido eliminar el presupuesto');
                return;
            }

            setBudgets(prev => prev.filter(p => p.id !== budget.id));
            successSwal('Presupuesto eliminado', 'El presupuesto se ha eliminado con éxito.');
        });
    };

    return (
        <>
            <div className="subheaderStyle d-flex justify-content-between align-items-center">
                <div className="ms-2">
                    Presupuestos
                </div>
                <div>
                    <button className="me-3 subheaderButton" onClick={() => goToBudget()} disabled={loading}>
                        <FontAwesomeIcon icon={['fas', 'plus']} className="me-2 fa-sm"/>
                        Crear presupuesto
                    </button>
                </div>
            </div>
            {loading ? (
                <Loading></Loading>
                ): (
                    <>
                        <div className={`d-flex flex-column align-items-center ${!isMenuMobile && 'mt-4'}`}>
                            {errorInitialData && (
                                <span className="alert alert-danger p-1 ps-4 pe-4 mb-1 mt-1 w-95 text-center">
                            <FontAwesomeIcon icon={['fas', 'triangle-exclamation']} className="me-2"/>
                                    {errorInitialData}
                        </span>
                            )}
                        </div>
                        <div className={`d-flex flex-column align-items-center ${isMenuMobile ? 'mt-3' : (errorInitialData ? 'mt-3' : 'mt-5')}`}>
                            <div className="appSection d-flex flex-wrap mb-5 p-3">
                        <span className="appTableTitle mt-0">
                            Filtros:
                        </span>
                                <form onSubmit={retrieveBudgets}>
                                    <div className="d-flex flex-wrap mt-2">
                                        <div className="filterDiv">
                                            <label className="filterLabelBudget">Importe mínimo:</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="filterInput appInput form-control text-end"
                                                value={form.expensesLimitGreaterOrEqualThan}
                                                onChange={(e) => setForm({ ...form, expensesLimitGreaterOrEqualThan: e.target.value })}
                                            />
                                        </div>

                                        <div className="filterDiv">
                                            <label className="filterLabelBudget">Importe máximo:</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min={form.expensesLimitGreaterOrEqualThan || undefined}
                                                className="filterInput appInput form-control text-end"
                                                value={form.expensesLimitLowerOrEqualThan}
                                                onChange={(e) => setForm({ ...form, expensesLimitLowerOrEqualThan: e.target.value })}
                                                onBlur={(e) => {
                                                    const min = parseFloat(form.expensesLimitGreaterOrEqualThan);
                                                    const max = parseFloat(e.target.value);

                                                    if (!isNaN(min) && !isNaN(max) && max < min) {
                                                        setForm({ ...form, expensesLimitLowerOrEqualThan: form.expensesLimitGreaterOrEqualThan });
                                                    }
                                                }}
                                            />
                                        </div>

                                        <div className="filterDiv">
                                            <label className="filterLabelBudget">Fecha inicial mínima:</label>
                                            <input
                                                type="date"
                                                className="filterInput appInput form-control text-end"
                                                value={form.startDateAfterOrEqualThan}
                                                onChange={(e) => setForm({ ...form, startDateAfterOrEqualThan: e.target.value })}
                                            />
                                        </div>

                                        <div className="filterDiv">
                                            <label className="filterLabelBudget">Fecha inicial máxima:</label>
                                            <input
                                                type="date"
                                                className="filterInput appInput form-control text-end"
                                                min={form.startDateAfterOrEqualThan || undefined}
                                                value={form.startDateBeforeOrEqualThan}
                                                onChange={(e) => setForm({ ...form, startDateBeforeOrEqualThan: e.target.value })}
                                                onBlur={() => {
                                                    if (form.startDateAfterOrEqualThan && form.startDateBeforeOrEqualThan && form.startDateBeforeOrEqualThan < form.startDateAfterOrEqualThan) {
                                                        setForm({ ...form, startDateBeforeOrEqualThan: form.startDateAfterOrEqualThan });
                                                    }
                                                }}
                                            />
                                        </div>

                                        <div className="filterDiv">
                                            <label className="filterLabelBudget">Fecha final mínima:</label>
                                            <input
                                                type="date"
                                                className="filterInput appInput form-control text-end"
                                                value={form.endDateAfterOrEqualThan}
                                                onChange={(e) => setForm({ ...form, endDateAfterOrEqualThan: e.target.value })}
                                            />
                                        </div>

                                        <div className="filterDiv">
                                            <label className="filterLabelBudget">Fecha final máxima:</label>
                                            <input
                                                type="date"
                                                className="filterInput appInput form-control text-end"
                                                min={form.endDateAfterOrEqualThan || undefined}
                                                value={form.endDateBeforeOrEqualThan}
                                                onChange={(e) => setForm({ ...form, endDateBeforeOrEqualThan: e.target.value })}
                                                onBlur={() => {
                                                    if (form.endDateAfterOrEqualThan && form.endDateBeforeOrEqualThan && form.endDateBeforeOrEqualThan < form.endDateAfterOrEqualThan) {
                                                        setForm({ ...form, endDateBeforeOrEqualThan: form.endDateAfterOrEqualThan });
                                                    }
                                                }}
                                            />
                                        </div>

                                        <div className="filterDiv">
                                            <label className="filterLabelBudget">Nombre:</label>
                                            <input
                                                type="text"
                                                className="filterInput appInput form-control"
                                                value={form.name}
                                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            />
                                        </div>

                                        <div className="filterDiv">
                                            <label className="filterLabel align-items-end" style={{width: '5rem'}}>Favorito:</label>
                                            <select
                                                className="form-control appInput form-select"
                                                value={form.favorite}
                                                style={{width: '80px', textAlignLast: 'center'}}
                                                onChange={(e) =>
                                                    setForm({...form, favorite: e.target.value === 'true' ? true :
                                                            e.target.value === 'false' ? false : ''})} >
                                                <option value="true">Sí</option>
                                                <option value="false">No</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="text-end me-3 mt-3">
                                        <button className="btn btn-primary appIndButton">
                                            <FontAwesomeIcon icon={['fas', 'filter']} />
                                            <span className="ms-2">Buscar presupuestos</span>
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

                                        <div className="d-flex flex-column gap-3">
                                            {budgets.length ? (
                                                budgets.map((budget) => (
                                                    <div key={budget.id} className="budget-card-mobile mb-3">
                                                        <div className="budget-card-header">
                                                            <h5>{budget.name}</h5>
                                                        </div>

                                                        <div className="budget-card-body">
                                                            <div className="budget-info-item">
                                                                <FontAwesomeIcon icon={['fas', 'calendar-alt']} className="me-2 fa-sm" />
                                                                <strong className="me-2">Inicio:</strong>{budget.startDate ? formatDate(budget.startDate) : '–'}
                                                            </div>
                                                            <div className="budget-info-item">
                                                                <FontAwesomeIcon icon={['fas', 'calendar-check']} className="me-2 fa-sm" />
                                                                <strong className="me-2">Fin:</strong>{budget.endDate ? formatDate(budget.endDate) : '–'}
                                                            </div>
                                                            <div className="budget-info-item">
                                                                <FontAwesomeIcon icon={['fas', 'wallet']} className="me-2 fa-sm" />
                                                                <strong className="me-2">Gasto Límite:</strong>{formatNumber(budget.expensesLimit)}
                                                            </div>
                                                            <div className="budget-info-item">
                                                                <FontAwesomeIcon icon={['fas', 'arrow-down']} className="me-2 fa-sm" />
                                                                <strong className="me-2">Gastos:</strong>{formatNumber(budget.totalExpenses)}
                                                            </div>
                                                            <div className="budget-info-item">
                                                                <FontAwesomeIcon icon={['fas', 'arrow-up']} className="me-2 fa-sm" />
                                                                <strong className="me-2">Ingresos:</strong>{formatNumber(budget.totalIncomes)}
                                                            </div>
                                                            <div className="budget-info-item">
                                                                <FontAwesomeIcon icon={['fas', 'star']} className="me-2 fa-sm" />
                                                                <strong className="me-2">Favorito:</strong>{budget.favorite ? 'Sí' : 'No'}
                                                            </div>
                                                        </div>

                                                        <div className="budget-card-actions mt-3">
                                                            <button className="btn btn-secondary appTableButton" onClick={() => goToBudgetWithId(budget.id)}>Detalle</button>
                                                            <button className="btn btn-danger appTableButton ms-4" onClick={() => makeDeleteBudget(budget)}>Eliminar</button>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="alert alert-warning text-center">
                                                    No tienes presupuestos para los criterios de búsqueda seleccionados.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <span className="w-95 text-start mb-3 appTableTitle"> Gastos e ingresos:</span>
                                        <div className="appTableContainer">

                                            <table className="table table-hover table-bordered appTable">
                                                <thead className="appTableHeader">
                                                <tr>
                                                    <th className="text-center" style={{width: '25%'}}>
                                                        Nombre
                                                    </th>
                                                    <th className="text-center" style={{width: '9%'}}>
                                                        Fecha inicio
                                                    </th>
                                                    <th className="text-center" style={{width: '9%'}}>
                                                        Fecha fin
                                                    </th>
                                                    <th className="text-center" style={{width: '11%'}}>
                                                        Limite de gasto
                                                    </th>
                                                    <th className="text-center" style={{width: '11%'}}>
                                                        Total Gastos
                                                    </th >
                                                    <th className="text-center" style={{width: '11%'}}>
                                                        Total Ingresos
                                                    </th>
                                                    <th className="text-center" style={{width: '8%'}}>
                                                        Favorito
                                                    </th>
                                                    <th className="text-center" style={isLineButtonsInTable ? {} : { minWidth: '225px' }}>
                                                    </th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {
                                                    budgets.length ? (
                                                        budgets.map((budget) => (
                                                            <tr key={budget.id}>
                                                                <td className="text-start">
                                                                    {budget.name}
                                                                </td>
                                                                <td className="text-center">
                                                                    {budget.startDate ? formatDate(budget.startDate) : '–'}
                                                                </td>
                                                                <td className="text-center">
                                                                    {budget.endDate ? formatDate(budget.endDate) : '–'}
                                                                </td>
                                                                <td className="text-end pe-4">
                                                                    {formatNumber(budget.expensesLimit)}
                                                                </td>
                                                                <td className="text-end pe-4">
                                                                    {formatNumber(budget.totalExpenses)}
                                                                </td>
                                                                <td className="text-end pe-4">
                                                                    {formatNumber(budget.totalIncomes)}
                                                                </td>
                                                                <td className="text-center">
                                                                    {budget.favorite ? 'Si' : 'No'}
                                                                </td>
                                                                <td className="text-center">
                                                                    <button className="btn btn-secondary appTableButton m-1" onClick={() => goToBudgetWithId(budget.id)}>Detalle</button>
                                                                    <button className="btn btn-danger appTableButton m-1" onClick={() => makeDeleteBudget(budget)}>Eliminar</button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="8" className="p-0 m-0">
                                                                <div className="m-0 p-0 d-flex flex-column align-items-center text-center" style={{backgroundColor: '#fff3cd'}}>
                                                                    <span className="mt-4 mb-4">No tienes presupuestos para los criterios de búsqueda seleccionados.</span>
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

export default Budgets;
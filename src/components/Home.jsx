import {useTitle} from "../hooks/commonHooks/useTitle.jsx";
import {AppTexts} from "../utils/AppTexts.jsx";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import React, {useState, useEffect} from "react";
import { useNavigate } from 'react-router-dom';
import {useAuth} from "../contexts/AuthContext.jsx";
import {getRecords} from "../serviceApiCalls/RecordApiService.jsx";
import {RecordType} from "../utils/RecordTypeEnum.jsx";
import {getBudgets} from "../serviceApiCalls/BudgetApiService.jsx";
import {formatDate, formatNumber} from "../utils/Formatters.jsx";
import Loading from "./loading/Loading.jsx";
import {useIsMenuMobile, useIsTableMobile} from "../hooks/responsiveHooks.jsx";

function Home() {
    useTitle(AppTexts.appName);
    const navigate = useNavigate();
    const [month, setMonth] = useState("");
    const [monthExpenseAmount, setMonthExpenseAmount] = useState("");
    const [budgets, setBudgets] = useState([]);
    const { userName } = useAuth();
    const [errorInitialRecords, setErrorInitialRecords] = useState(null);
    const [errorInitialBudgets, setErrorInitialBudgets] = useState(null);
    const [loading, setLoading] = useState(false);
    const isMenuMobile = useIsMenuMobile();
    const isTableMobile = useIsTableMobile();

    const gotoRegister = () => {
        navigate('/record');
    }

    const navigateToBudget = (id) => {
        navigate(`/budget/${id}`);
    }

    const formatLocalDate = (date) => {
        const offset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() - offset);
        return localDate.toISOString().split('T')[0];
    };

    useEffect(() => {
        setLoading(true);
        setErrorInitialBudgets(null);
        setErrorInitialRecords(null);

        const fetchData = async () => {
            try {
                const now = new Date();
                const mesActual = now.toLocaleDateString('es-ES', { month: 'long' }).toLowerCase();
                setMonth(mesActual);

                const firstMonthDay = new Date(now.getFullYear(), now.getMonth(), 1);
                const lastMonthDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

                const recordsParams = {
                    recordType: RecordType.EXPENSE,
                    dateAfterOrEqualThan: formatLocalDate(firstMonthDay),
                    dateBeforeOrEqualThan: formatLocalDate(lastMonthDay),
                };

                const [recordsResponse, budgetsResponse] = await Promise.all([
                    getRecords(recordsParams),
                    getBudgets({favorite: true})
                ]);

                if (!recordsResponse.ok) {
                    setErrorInitialRecords('No se han podido obtener los registros del usuario.');
                    console.error('Error en la consulta de registros: ', recordsResponse.respuesta);
                    setMonthExpenseAmount("0,00");
                } else {
                    const data = recordsResponse.respuesta || [];
                    const monthAmount = data.reduce((sum, expense) => sum + (expense.money || 0), 0);

                    const formattedAmount = monthAmount
                        .toFixed(2)
                        .replace('.', ',')
                        .replace(/\B(?=(\d{3})+(?!\d))/g, '.');

                    setMonthExpenseAmount(formattedAmount);
                }

                if (!budgetsResponse.ok) {
                    console.error('Error en la consulta de presupuestos: ', budgetsResponse.respuesta);
                } else {
                    setBudgets(budgetsResponse.respuesta || []);
                }

                setLoading(false);

            } catch (error) {
                setErrorInitialBudgets('No se han podido obtener los presupuestos del usuario.');
                console.error('Error en las llamadas a la API:', error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const gotoBudget = () => {
        navigate('/budget');
    }

    return (
        <>
            <div className="subheaderStyle d-flex justify-content-between align-items-center">
                <div className="ms-2">
                    Inicio
                </div>
                <div>
                    <button className="me-3 subheaderButton" onClick={gotoRegister} disabled={loading}>
                        <FontAwesomeIcon icon={['fas', 'plus']} className="me-2 fa-sm"/>
                        Añadir registro
                    </button>
                </div>
            </div>
            <div className="mt-4 mb-3 d-flex flex-column align-items-center">
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
            {
                loading ? (
                    <Loading></Loading>
                ) : (
                    <>
                        <div className="d-flex flex-column align-items-center">
                            <span className={`${!isMenuMobile && 'mt-4'}`} style={{fontWeight: "bold", fontSize: "1.2rem"}}>
                                Bienvenido {userName}
                            </span>
                            <span className="mt-4">
                                Gastos del mes de {month}: <span className="ms-1" style={{fontWeight: 'bold'}}>{monthExpenseAmount} €</span>
                            </span>
                        </div>
                        <div className="d-flex flex-column align-items-center mt-5">
                            {
                                isTableMobile ? (
                                    <div className="w-95 mx-auto">
                                        <div className="budget-header-mobile mb-3">
                                            <h5 className="text-center m-0">Presupuestos favoritos</h5>
                                        </div>

                                        {budgets.length > 0 ? (
                                            <div className="d-flex flex-column gap-3">
                                                {budgets.map((budget) => (
                                                    <div key={budget.id} className="budget-card-mobile mb-3">
                                                        <div className="budget-card-header">
                                                            <h5>{budget.name}</h5>
                                                        </div>

                                                        <div className="budget-card-body">
                                                            <div className="budget-info-item">
                                                                <FontAwesomeIcon icon={['fas', 'calendar-alt']} className="me-2 fa-sm" />
                                                                <strong>Inicio:</strong>&nbsp;{budget.startDate ? formatDate(budget.startDate) : '–'}
                                                            </div>
                                                            <div className="budget-info-item">
                                                                <FontAwesomeIcon icon={['fas', 'calendar-check']} className="me-2 fa-sm" />
                                                                <strong>Fin:</strong>&nbsp;{budget.endDate ? formatDate(budget.endDate) : '–'}
                                                            </div>
                                                            <div className="budget-info-item">
                                                                <FontAwesomeIcon icon={['fas', 'wallet']} className="me-2 fa-sm" />
                                                                <strong>Límite:</strong>&nbsp;{formatNumber(budget.expensesLimit)}
                                                            </div>
                                                            <div className="budget-info-item">
                                                                <FontAwesomeIcon icon={['fas', 'arrow-down']} className="me-2 fa-sm" />
                                                                <strong>Gastos:</strong>&nbsp;{formatNumber(budget.totalExpenses)}
                                                            </div>
                                                            <div className="budget-info-item">
                                                                <FontAwesomeIcon icon={['fas', 'arrow-up']} className="me-2 fa-sm" />
                                                                <strong>Ingresos:</strong>&nbsp;{formatNumber(budget.totalIncomes)}
                                                            </div>
                                                        </div>

                                                        <div className="budget-card-actions mt-3">
                                                            <button
                                                                className="btn btn-secondary appTableButton"
                                                                onClick={() => navigateToBudget(budget.id)}
                                                            >
                                                                Detalle
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="alert alert-warning text-center p-3">
                                                <p className="mb-3">No tienes presupuestos favoritos. Haz click en el botón para añadir uno.</p>
                                                <button className="btn btn-warning appIndButton" onClick={gotoBudget}>
                                                    <FontAwesomeIcon icon={['fas', 'wallet']} />
                                                    <span className="ms-2">Crear presupuesto</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <span className="w-95 text-start mb-3 appTableTitle"> Presupuestos favoritos:</span>
                                        <div className="appTableContainer">
                                            <table className="table table-hover table-bordered appTable">
                                                <thead className="appTableHeader">
                                                <tr>
                                                    <th style={{width: '21%'}}>
                                                        Nombre
                                                    </th>
                                                    <th className="text-center" style={{width: '12%'}}>
                                                        Fecha inicio
                                                    </th>
                                                    <th className="text-center" style={{width: '12%'}}>
                                                        Fecha fin
                                                    </th>
                                                    <th className="text-center" style={{width: '15%'}}>
                                                        Límite de gasto
                                                    </th>
                                                    <th className="text-center" style={{width: '15%'}}>
                                                        Total gastos
                                                    </th >
                                                    <th className="text-center" style={{width: '15%'}}>
                                                        Total ingresos
                                                    </th>
                                                    <th style={{width: '10%'}}>
                                                    </th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {
                                                    budgets.length ? (
                                                        budgets.map((budget) => (
                                                            <tr key={budget.id}>
                                                                <td>
                                                                    {budget.name}
                                                                </td>
                                                                <td className="text-center">
                                                                    {budget.startDate ? formatDate(budget.startDate) : '–'}
                                                                </td>
                                                                <td className="text-center">
                                                                    {budget.endDate ? formatDate(budget.endDate) : '–'}
                                                                </td>
                                                                <td className="text-end pe-2">
                                                                    {formatNumber(budget.expensesLimit)}
                                                                </td>
                                                                <td className="text-end pe-2">
                                                                    {formatNumber(budget.totalExpenses)}
                                                                </td>
                                                                <td className="text-end pe-4">
                                                                    {formatNumber(budget.totalIncomes)}
                                                                </td>
                                                                <td className="text-center" onClick={() => navigateToBudget(budget.id)}>
                                                                    <button className="btn btn-secondary appTableButton">Detalle</button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="7" className="p-0 m-0">
                                                                <div className="m-0 p-0 d-flex flex-column align-items-center text-center" style={{backgroundColor: '#fff3cd'}}>
                                                                    <span className="mt-4">No tienes presupuestos favoritos. Haz click en el botón para añadir un nuevo presupuesto.</span>
                                                                    <button className="btn btn-warning mt-4 mb-4 appIndButton" onClick={gotoBudget}>
                                                                        <FontAwesomeIcon icon={['fas', 'wallet']} />
                                                                        <span className="ms-2">Crear presupuesto</span>
                                                                    </button>
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

export default Home;
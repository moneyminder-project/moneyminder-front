import React, {useEffect, useState} from "react";
import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {Tooltip} from "react-tooltip";

function Menu() {
    const [collapsed, setCollapsed] = useState(() => {
        const savedState = localStorage.getItem("menuCollapsed");
        return savedState === "true";
    });

    const toggleCollapse = () => setCollapsed(!collapsed);

    const menuItems = [
        { to: "/", icon: "home", label: "Inicio" },
        { to: "/records", icon: "money-bill-wave", label: "Gastos e Ingresos" },
        { to: "/budgets", icon: "wallet", label: "Presupuestos" },
        { to: "/requests", icon: "users", label: "Solicitudes" },
    ];

    useEffect(() => {
        const savedState = localStorage.getItem("menuCollapsed");
        if (savedState !== null) {
            setCollapsed(savedState === "true");
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("menuCollapsed", collapsed.toString());
    }, [collapsed]);

    return (
        <div
            className="d-flex flex-column menuColor border-end"
            style={{
                width: collapsed ? "72px" : "260px",
                minWidth: collapsed ? "72px" : "260px",
                overflow: "hidden",
                transition: "width 0.3s ease, min-width 0.3s ease",

            }}
        >
            <div className="d-flex flex-column h-100 px-2 ms-2 me-2">
                <ul className="nav nav-pills flex-column flex-grow-1 mt-2 mb-2">
                    {menuItems.map((item, index) => (
                        <li key={index} className="nav-item mt-2 mb-2">
                            <NavLink to={item.to} className={({ isActive }) =>
                                `nav-link d-flex align-items-center ${isActive ? "menuSelectedColor text-dark" : "text-dark"}`}
                                     style={{ height: "42px", padding: 0 }}>
                                <div className="d-flex justify-content-center align-items-center" style={{ width: "40px" }}
                                     data-tooltip-id="menu-tooltip" data-tooltip-content={item.label}>
                                    <FontAwesomeIcon icon={['fas', item.icon]} />
                                </div>
                                {!collapsed && (
                                    <span className="text-start text-nowrap overflow-hidden text-truncate"
                                          style={{ minWidth: 0 }}>
                                        {item.label}
                                    </span>
                                )}
                            </NavLink>
                        </li>
                    ))}
                </ul>
                <div className="mt-auto mb-3">
                    <button className="btn btn-outline-success btn-left-menu w-100 d-flex align-items-center justify-content-center"
                            onClick={toggleCollapse} style={{ height: "37px", padding: 0 }}>
                        <FontAwesomeIcon icon={['fas', collapsed ? 'angles-right' : 'angles-left']} />
                        {!collapsed && <span className="ms-2 text-start text-nowrap overflow-hidden text-truncate">Contraer</span>}
                    </button>
                </div>
            </div>
            {collapsed && (<Tooltip id="menu-tooltip" place="right" className="tooltip-custom-style"></Tooltip>)}
        </div>
    );
}

export default Menu;







import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

function Loading() {
    return (
        <div className="d-flex justify-content-center align-items-center w-100 fade-in-delay" style={{ height: 'calc(100vh - 200px)' }}>
            <div className="text-center">
                <FontAwesomeIcon
                    icon={['fas', 'circle-notch']}
                    spin
                    style={{ fontSize: '4rem', color: '#FB8C00' }}
                />
                <div className="fw-bold fs-3 mt-4" style={{ color: '#2E8A75' }}>
                    Cargando página
                </div>
                <div className="fs-6 text-muted">Un momento por favor...</div>
            </div>
        </div>
    );
}

export default Loading
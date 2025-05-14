import Swal from "sweetalert2";

const customClass = {
    title: 'swal2-title-sm',
    popup: 'swal2-popup-sm',
    htmlContainer: 'swal2-text-sm'
};

export const successSwal = (title, text) => {
    Swal.fire({
        icon: "success",
        title,
        text,
        showConfirmButton: false,
        timer: 2500,
        allowOutsideClick: true,
        customClass
    });
};

export const errorSwal = (title, text) => {
    Swal.fire({
        icon: "error",
        title,
        text,
        showConfirmButton: false,
        timer: 2500,
        reverseButtons: true,
        allowOutsideClick: true,
        customClass
    });
};

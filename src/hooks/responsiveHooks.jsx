
import { useMediaQuery } from 'react-responsive';

export const useIsMenuMobile = () => {
    return useMediaQuery({ maxWidth: '700px' });
};

export const useIsTableMobile = () => {
    return useMediaQuery({ maxWidth: '900px' });
}

export const useIsButtonMobile = () => {
    return useMediaQuery({ maxWidth: '800px' });
}

export const useIsLineButtonsInTable = () => {
    return useMediaQuery({ maxWidth: '1200px' });
}

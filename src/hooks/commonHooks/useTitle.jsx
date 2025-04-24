import { useEffect } from "react";

function useTitle(title) {
    useEffect(() => {
        document.title = title;
    }, [title]);
}

function useTitleWithAppName(title) {
    useTitle(`MM - ${title}`);
}

export { useTitle, useTitleWithAppName };

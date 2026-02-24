import * as React from "react"

export function useIsMobile() {
    const [isMobile, setIsMobile] = React.useState<boolean>(false)

    React.useEffect(() => {
        const mql = window.matchMedia("(max-width: 768px)")
        const onChange = () => setIsMobile(mql.matches)
        mql.addEventListener("change", onChange)
        setIsMobile(mql.matches)
        return () => mql.removeEventListener("change", onChange)
    }, [])

    return !!isMobile
}

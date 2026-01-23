export const getDecodedToken = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
};

export const getUserRole = (): string | null => {
    const decoded = getDecodedToken();
    return decoded ? decoded.role : null;
};

export const isAdmin = (): boolean => {
    return getUserRole() === 'ADMIN';
};

export const getUsernameFromToken = (): string | null => {
    const decoded = getDecodedToken();
    return decoded ? (decoded.sub || decoded.username) : null;
};
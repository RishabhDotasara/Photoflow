
// write a local storage manager
class LocalStoreManager {
    static setItem(key: string, value: string) {
        if (typeof window !== 'undefined') {
            localStorage.setItem(key, value);
        }
    }

    static getItem(key: string): string | null {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(key);
        }
        return null;
    }

    static removeItem(key: string) {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(key);
        }
    }
}

export default LocalStoreManager;
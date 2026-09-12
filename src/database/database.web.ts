export type WebDatabase = {
    getFirstAsync<T>(sql: string): Promise<T | null>;
};

const webDatabase: WebDatabase = {
    async getFirstAsync<T>(_sql: string): Promise<T | null> {
        return null;
    },
};

export async function getDatabase(): Promise<WebDatabase> {
    return webDatabase;
}
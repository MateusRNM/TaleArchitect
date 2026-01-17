import { exists } from '@tauri-apps/plugin-fs';

export interface RecentProject {
    name: string;
    dir: string;
    createdAt: string;
    lastOpenedAt: string;
}

class RecentProjectsStore {
    list = $state<RecentProject[]>([]);

    constructor() {
        this.loadFromStorage();
    }

    private async loadFromStorage(): Promise<RecentProject[] | void> {
        const saved = localStorage.getItem('recentProjects');
        if (saved) {
            let projects: RecentProject[] = JSON.parse(saved);
            
            const checkExistence = await Promise.all(
                projects.map(async (p) => {
                    const fileExists = await exists(p.dir);
                    return fileExists ? p : null;
                })
            );
            
            this.list = checkExistence.filter((p) => p !== null) as RecentProject[];
            this.sortAndSave();
        }
    }

    addOrUpdate(project: { name: string, dir: string, createdAt: string, lastOpenedAt: string }) {
        const index = this.list.findIndex(p => p.dir === project.dir);
        
        if (index !== -1) {
            this.list[index] = { ...this.list[index], ...project };
        } else {
            this.list.push(project);
        }
        this.sortAndSave();
    }

    remove(dir: string) {
        this.list = this.list.filter((v) => v.dir !== dir);
        this.sortAndSave();
    }

    private sortAndSave() {
        this.list.sort((a, b) => new Date(b.lastOpenedAt).getTime() - new Date(a.lastOpenedAt).getTime());
        localStorage.setItem('recentProjects', JSON.stringify(this.list));
    }
}

export const recentStore = new RecentProjectsStore();
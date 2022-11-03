import {TextGeneratorConfiguration,PackageTemplate,PromptTemplate} from "./types";
import { App,normalizePath,request } from "obsidian";
import {gt} from "semver";

export default class PackageManager {
    configuration: TextGeneratorConfiguration;
    app: App;
    promptsPath: string;
	constructor(app:App,promptsPath:string) {
        this.app = app;
        this.promptsPath=promptsPath;
    }

    async load() {
        const adapter = this.app.vault.adapter;
        const configPath = this.getConfigPath();
        /*if (await adapter.exists(configPath)){
            this.configuration=JSON.parse(await adapter.read(configPath));
            console.log({configuration:this.configuration});
        } else {*/
            await this.initConfigFlie();
        
        //}

    }
     
    async initConfigFlie()
    {
        const initConfig = {
            packages: [],
            installedPackages:[]
            }
            const adapter=this.app.vault.adapter;
            adapter.write(this.getConfigPath(),JSON.stringify(initConfig));
            this.configuration=JSON.parse(await adapter.read(this.getConfigPath()));
    }

    getConfigPath(){
       return normalizePath(this.app.vault.configDir + "/text-generator.json");
    }
    async save() {
        const adapter = this.app.vault.adapter;
        const configPath = this.getConfigPath();
        adapter.write(
            configPath,
            JSON.stringify(this.configuration),
        ) 
        
    }

    async checkUpdates(){
        await this.updatePackagesList();
        await this.updatePackagesInfo();
        let packagesIdsToUpdate:string[]=[];
        this.configuration.installedPackages.forEach((installedPackage)=>{
         
            debugger;
            if (gt(this.getPackageById(installedPackage.packageId).version,installedPackage.version ) ) {
            packagesIdsToUpdate.push(installedPackage.packageId);
           } 
        })
        return packagesIdsToUpdate;
    }

    async updatePackagesList() {
        const remotePackagesListUrl=`https://raw.githubusercontent.com/nhaouari/text-generator-packages/master/community-packages.json`;
        const remotePackagesList:PackageTemplate[] = JSON.parse(await request({url: remotePackagesListUrl}));
        console.log(remotePackagesList);
        if (remotePackagesList.length > this.configuration.packages.length) {
            const indexLastPackage = remotePackagesList.findIndex(p=>p.packageId === this.configuration.packages[this.configuration.packages.length-1].packageId) 
            if (indexLastPackage !== -1) {
                for (let index = indexLastPackage+1; index < remotePackagesList.length ; index++) {
                    this.configuration.packages.push(remotePackagesList[index])  
                }
                this.save();
            }
        }
    }


    async updatePackagesInfo() {
        await Promise.all(this.configuration.packages.map(p=>this.updatePackageInfoById(p.packageId))) 
    }

    async updatePackageInfoById(packageId:string) {
        const p=this.getPackageById(packageId);
        const repo=p.repo;
        const release = await this.getRelease(repo);
        const manifest= await this.getAsset(release,'manifest.json'); 
        this.setPackageInfo(packageId,manifest);
        await this.save();
    }

    setPackageInfo(packageId:string,info:PackageTemplate) {
        const packageIndex=this.configuration.packages.findIndex(p=>p.packageId===packageId);
        this.configuration.packages[packageIndex]=info;
    }

    async addPackage(repo:string){
        // download assets: manifest file, prompts.json
        // add manifest to this.configuration.packages {packageId,prompts,installedPrompts=empty}
        const release = await this.getRelease(repo);
        const manifest= await this.getAsset(release,'manifest.json'); 
        this.configuration.packages.push(manifest);
        await this.save();
    }

    async installPackage(packageId:string, installAllPrompts:boolean=true){
        const p=await this.getPackageById(packageId);
        const repo = p.repo;
        const release = await this.getRelease(repo);
        const prompts= await this.getAsset(release,'prompts.json'); 
        // this.configuration.installedPackages {packageId,prompts,installedPrompts=empty}
        const installedPrompts:string []=[];
        this.configuration.installedPackages.push({packageId,prompts,installedPrompts,version:p.version});

        if(installAllPrompts) {
            await Promise.all(prompts.map(prompt=>this.installPrompt(packageId,prompt.promptId)));
            console.log("all prompts installed");
        }
        
        await this.save();
    }

    getPackageById(packageId:string):PackageTemplate{
        return this.configuration.packages.find(p=>p.packageId===packageId);
    }

    getPromptById(packageId:string,promptId:string) {
        return this.configuration.installedPackages.find(p=>p.packageId === packageId).prompts.find(prompt=>prompt.promptId===promptId);
    }

   // repo : nhaouari/gpt-3-prompt-templates
    async getRelease(repo:string) {
		const rawReleases = JSON.parse(await request({
			url: `https://api.github.com/repos/${repo}/releases`,
		}));

		const rawRelease: any = rawReleases.filter((x: any) => !x.draft && !x.prerelease).sort((x: any) => x.published_at)[0]
		const release = {
			version: rawRelease.tag_name,
			assets: rawRelease.assets.map((asset: any) => ({
				name: asset.name,
				url: asset.browser_download_url,
			}))			
		}
		
		return release;
	}
    /** https://github.com/plugins-galore/obsidian-plugins-galore/blob/bd3553908fa9eacf33a5e1c2e7b0dea2a02a9d80/src/util/gitServerInterface.ts#L86 */
	async getAsset (release: any, name: string) {
		const asset = release.assets.filter(asset => asset.name === name)[0];
		if (!asset) {
			return null;
		}
		return JSON.parse(await request({
			url: asset.url,
		}));
	}

    async installPrompt(packageId:string,promptId:string,overwrite:boolean=true) {
        const repo = await this.getPackageById(packageId).repo;
			const url=`https://raw.githubusercontent.com/${repo}/master/prompts/${promptId}.md`;
            console.log(url);
			try {
                await this.writePrompt(packageId,promptId,await request({url:url}),overwrite);
                debugger;
                this.configuration.installedPackages.find(p=>p.packageId===packageId).installedPrompts.push({promptId:promptId,version:this.getPromptById(packageId,promptId).version});
            } catch (error) {
                console.error(error);
                Promise.reject(error);
            }
    }

    getPromptPath(packageId:string,promptId:string) {
		const promptsPath= this.promptsPath;
		//app.vault.configDir
		const templatePath=normalizePath(`${promptsPath}/${packageId}/${promptId}.md`);
		return templatePath;
	}

    async writePrompt(packageId:string,promptId:string,content:any,overwrite:boolean) {
		console.log({packageId,promptId,content});
		const path = this.getPromptPath(packageId,promptId);
		const adapter = this.app.vault.adapter;
		try {
            const packageDir=normalizePath(this.promptsPath+'/'+packageId);
			if (!(await adapter.exists(packageDir))) {
				await adapter.mkdir(packageDir);
			}
			let write = true;
			if(await adapter.exists(path)) {
				let text = "Template "+path+" exists!\nEither OK to Overread or over Cancel.";
					if (await confirm(text) == false) {
						write = false;
					} 
			} 

			if(write){
				adapter.write(
					path,
					content,
				)
			}

			
		} catch (error) {
			console.error(error);
			Promise.reject(error);
		}
	}

    async removePackage() {
    }
}
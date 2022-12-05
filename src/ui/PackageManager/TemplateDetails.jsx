import React,{useState,useEffect} from 'react'

function TemplateDetails({packageId,packageManager,updateView,setSelectedIndex,checkForUpdates}) {

  return (
    			<div className="community-modal-details">
                    <div className="modal-setting-nav-bar">
                        <div className="clickable-icon" aria-label="Back" onClick={()=>setSelectedIndex(-1)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                        strokeLinejoin="round" className="svg-icon lucide-chevron-left" >
                        <polyline points="15 18 9 12 15 6"/>
                        </svg>
                        </div>
                    </div>
				    {packageId&&getTemplateDetails(packageId,packageManager,updateView,checkForUpdates)}
			    </div>
  )
}

function getTemplateDetails(packageId,packageManager,updateView,checkForUpdates) {
    const [htmlVar, setHtmlVar]= useState("");
    const [props, setProps]= useState({package:packageManager.getPackageById(packageId),installed:packageManager.getInstalledPackageById(packageId)});
    
    useEffect(() => {
        setProps({package:packageManager.getPackageById(packageId),installed:packageManager.getInstalledPackageById(packageId)});
        packageManager.getReadme(packageId).then((html)=>{
            setHtmlVar(html);
        })
     }, [packageId])
     
    async function install () {
       await packageManager.installPackage(packageId);
       updateLocalView();
       updateView();
    }

    async function uninstall () {
       await packageManager.uninstallPackage(packageId);
       updateLocalView();
       updateView();
    }

    async function update () {
        await packageManager.updatePackage(packageId);
        updateLocalView();
        updateView();
        checkForUpdates();
     }

    function updateLocalView () {
        setProps({package:packageManager.getPackageById(packageId),installed:packageManager.getInstalledPackageById(packageId)});
     }
     
    return (
        <div className="community-modal-info">
        <div className="community-modal-info-name">{props.package.name}
        {props.installed&&<span className="flair mod-pop">Installed</span>}
        </div>
        <div className="community-modal-info-downloads">
                <span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24"
                    height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round" className="svg-icon lucide-download-cloud">
                    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
                    <path d="M12 12v9"></path>
                    <path d="m8 17 4 4 4-4"></path>
                </svg>
                </span>
                <span className="community-modal-info-downloads-text">{props.package.downloads}</span>
        </div>
        <div className="community-modal-info-version">Version: {props.package.version} {props.installed&&`(currently installed: ${props.installed.version})`}</div>
        <div className="community-modal-info-author">By <a target="_blank"
                href={`${props.package.authorUrl}`}>{props.package.author}</a></div>
        <div className="community-modal-info-repo">Repository: <a target="_blank" 
                href={`https://github.com/${props.package.repo}`}>{props.package.repo}</a>
        </div>
        <div className="community-modal-info-desc">{props.package.description}</div>
        <div className="community-modal-button-container">
        <button className="mod-cta" onClick={()=>window.location.href=`${props.package.authorUrl}`}> Support </button>
        

        {props.installed?
        <span>
            <button className="mod-cta" onClick={()=>uninstall()}>Uninstall</button>
            {props.installed.version !== props.package.version&& <button className="mod-cta" onClick={()=>update()}>Update</button>}
        </span>
         :
        <button className="mod-cta" onClick={()=>install()}>Install</button>
        }
        
        </div>
        <hr/>
        <div dangerouslySetInnerHTML={{
                __html: htmlVar.innerHTML
            }} className="community-modal-readme markdown-rendered">
        </div>
        </div>
    )
}

export default TemplateDetails
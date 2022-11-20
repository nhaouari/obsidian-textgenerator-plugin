import React,{useState,useEffect} from 'react'

function TemplateDetails({props,packageManager,updateView}) {
  return (
    			<div className="community-modal-details">
                    <div className="modal-setting-nav-bar">
                        <div className="clickable-icon" aria-label="Back">
                        </div>
                    </div>
				    {props&&getTemplateDetails(props,packageManager,updateView)}
			    </div>
  )
}

function getTemplateDetails(props,packageManager,updateView) {
    const [htmlVar, setHtmlVar]= useState("");
    
    useEffect(() => {
        /*packageManager.getReadme(props.packageId).then((html)=>{
            setHtmlVar(html);
        })*/
     }, [])
     
    async function install () {
       await packageManager.installPackage(props.packageId);
       
       await updateView();
    }

    async function uninstall () {
       await packageManager.uninstallPackage(props.packageId);
       await updateView();
    }

    async function update () {
        await packageManager.installPackage(props.packageId);
        await updateView();
     }

    return (
        <div className="community-modal-info">
        <div className="community-modal-info-name">{props.name}
        {props.installed&&<span className="flair mod-pop">Installed</span>}
        </div>
        <div className="community-modal-info-downloads"><span><svg xmlns="http://www.w3.org/2000/svg" width="24"
                    height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round" className="svg-icon lucide-download-cloud">
                    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
                    <path d="M12 12v9"></path>
                    <path d="m8 17 4 4 4-4"></path>
                </svg></span><span className="community-modal-info-downloads-text">{props.downloads}</span></div>
        <div className="community-modal-info-version">Version: {props.version}</div>
        <div className="community-modal-info-author">By <a target="_blank" rel="noopener"
                href={`${props.repo}`}>{props.author}</a></div>
        <div className="community-modal-info-repo">Repository: <a target="_blank" rel="noopener"
                href={`${props.repo}`}>{props.repo}</a>
        </div>
        <div className="community-modal-info-desc">{props.description}</div>
        <div className="community-modal-button-container">
        {props.installed?
        <div>
            <button className="mod-cta" onClick={()=>uninstall()}>Uninstall</button>
            <button className="mod-cta" onClick={()=>update()}>Update</button>
        </div>
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
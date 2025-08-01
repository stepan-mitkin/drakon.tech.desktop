function Ide3Logic(gSpaceId, folderName, gUserId, browser, translate) {

var Nav = NavModule()

var gSkipPushState = false
var FEATURE_SAVE_PROJECT = true
var Root = "https://drakonhub.com/"
var IDE = "ide"

var MinSplitter = 30
var ProjectsPath = "/" + IDE + "/spaces"

var globs = null
var AppName = "DrakonTech"

var PollInterval = 1
var MaxSaveItems = 30
var DarkBackground = "#455A64"

var AddUserMs = 300
var BuildCheck = 513

const cutColor = "#909090"
var gCutFolders = {}

function AccessShower_AccessScreen_addUser(self, data) {
    self.role = data
    var machine = new UserAdder()
    machine.target = self
    machine.existing = Utils.copyObject(
        self.access.roles[data]
    )
    browser.showAddUserScreen(
        machine
    )
    self.state = "AddingUser";
}

function shutdown() {
    hidePopups()
}

function hidePopups() {
    browser.hideCentral()
    HtmlUtils.hidePopup()
    HtmlUtils.hideSoftPopup()  
    getEditor().hideSearch()
    browser.cancelBuild()
}

function AccessShower_AccessScreen_cancel(self, data) {
    browser.hideCentral()
    complete(self, data)
    self.state = null;
}

function AccessShower_AccessScreen_onData(self, data) {
    var admins = Object.keys(
        self.access.roles.admin
    )
    if (admins.length == 0) {
        browser.setAccessError(
            translate("ERR_NO_ADMINS")
        )
        self.state = "AccessScreen";
    } else {
        var change = buildAccessChange(
            self.oldAccess,
            self.access
        )
        if (change) {
            browser.showWorking()
            browser.sendPost(
            	"/api/multi_access",
            	change,
            	self
            )
            self.state = "SavingAccess";
        } else {
            browser.hideCentral()
            complete(self, data)
            self.state = null;
        }
    }
}

function AccessShower_AccessScreen_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function AccessShower_AccessScreen_removeUser(self, data) {
    self.access.remove(
        data.role,
        data.user
    )
    self.state = "AccessScreen";
}

function AccessShower_AccessScreen_togglePublic(self, data) {
    var old = self.access.isPublic
    self.access.isPublic = !old
    self.access.setPublicAccess = true
    self.state = "AccessScreen";
}

function AccessShower_AddingUser_cancel(self, data) {
    browser.showAccessScreen(
        self.access,
        null
    )
    self.state = "AccessScreen";
}

function AccessShower_AddingUser_onData(self, data) {
    self.access.add(
        self.role,
        data
    )
    browser.showAccessScreen(
        self.access,
        null
    )
    self.state = "AccessScreen";
}

function AccessShower_GettingAccess_onData(self, data) {
    browser.hideWorking()
    self.access = createAccess(
        self.spaceId,
        data
    )
    self.oldAccess = Utils.copyObjectDeep(
        self.access
    )
    browser.showAccessScreen(
        self.access,
        self
    )
    self.state = "AccessScreen";
}

function AccessShower_GettingAccess_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function AccessShower_SavingAccess_onData(self, data) {
    browser.hideWorking()
    browser.hideCentral()
    saveAccessData(
        self.access
    )
    complete(self, data)
    self.state = null;
}

function AccessShower_SavingAccess_onError(self, data) {
    browser.hideWorking()
    browser.hideCentral()
    if ((data.error == "ERR_USER_LIMIT") && (data.suggested)) {
        browser.suggest(
            data.error,
            data.suggested,
            "access"
        )
    } else {
        panic(data)
    }
    self.state = "AccessScreen";
}

function AccessShower_Start_onData(self, data) {
    self.spaceId = data
    var url = "/api/access/" + 
     self.spaceId
    browser.showWorking()
    browser.sendGet(
        url,
        self
    )
    self.state = "GettingAccess";
}

function AccessShower_Start_onError(self, data) {
    self.state = null;
}

function AllBuilder_Checking_cancelBuild(self, msg) {
    stopBuild(
        self
    )
    self.state = null;
}

function AllBuilder_Checking_onData(self, msg) {
    var options
    options = {
        state : msg.state,
        module : msg.name
    }
    if (msg.state == "working") {
        browser.showBuild(
            options
        )
        scheduleBuildCheck(
            self
        )
        self.state = "Working";
    } else {
        if (msg.state == "error") {
            options.errors = msg.errors || []
        }
        browser.showBuild(
            options
        )
        self.target.onData(msg)
        self.state = null;
    }
}

function AllBuilder_Checking_onError(self, msg) {
    onBuilderError(self, msg)
    self.state = null;
}

function AllBuilder_Created_default(self, msg) {
    self.state = "Created";
}

function AllBuilder_Created_onData(self, msg) {
    self.module = msg.module
    self.url = msg.url
    scheduleBuildCheck(
        self
    )
    self.state = "Working";
}

function AllBuilder_Working_cancelBuild(self, msg) {
    stopBuild(
        self
    )
    self.state = null;
}

function AllBuilder_Working_timeout(self, msg) {
    checkBuild(
        self
    )
    self.state = "Checking";
}

function BuildManager_Building_cancelBuild(self, msg) {
    self.builder.cancelBuild()
    self.builder = undefined
    self.state = "Idle";
}

function BuildManager_Building_onData(self, msg) {
    var options
    options = {
        state : msg.state,
        module : msg.module,
        url : msg.url,
        generatedPseudocode: msg.generatedPseudocode
    }
    if (msg.state == "error") {
        options.errors = msg.errors || []
    }
    browser.showBuild(
        options
    )
    self.state = "Idle";
}

function BuildManager_Building_onError(self, msg) {
    self.state = "Idle";
}

function BuildManager_ChoosingModule_cancel(self, msg) {
    browser.hideCentral()
    self.state = "Idle";
}

function BuildManager_ChoosingModule_onData(self, msg) {
    var module
    browser.hideCentral()
    module = self.modules[msg]
    self.current.module = module.id
    self.current.module_name = module.name
    sendBuild(self)
    self.state = "Building";
}

function BuildManager_GettingModules_onData(self, msg) {
    var modules
    browser.hideWorking()
    modules = msg.modules.map(
        makeModule
    )
    if (modules.length == 0) {
        browser.showNoModules(self)
        self.state = "Idle";
    } else {
        self.modules = Utils.listToMap(
            modules,
            "id"
        )
        Utils.sort(
            modules,
            "name"
        )
        browser.showChooseModule(
            modules,
            self
        )
        self.state = "ChoosingModule";
    }
}

function BuildManager_GettingModules_onError(self, msg) {
    browser.hideWorking()
    panic(msg)
    self.state = "Idle";
}

function BuildManager_Idle_build(self, msg) {
    sendBuild(self)
    self.state = "Building";
}

function BuildManager_Idle_buildModule(self, msg) {
    var current, url
    current = msg
    console.log(folderName, msg)
    self.current = current
    console.log(current, isHuman(current))
    if (isHuman(current)) {
        browser.showWorking()
        url = "/api/prog_modules/" + 
        	current.spaceId
        browser.sendGet(
            url,
            self
        )
        self.state = "GettingModules";
    } else {
        sendBuild(self)
        self.state = "Building";
    }
}

function BuildManager_Idle_cancel(self, msg) {
    browser.hideCentral()
    self.state = "Idle";
}

function BuildManager_Idle_showBuild(self, msg) {
    sendBuild(self)
    self.state = "Building";
}

function Builder_Checking_cancelBuild(self, msg) {
    stopBuild(
        self
    )
    self.state = null;
}

function Builder_Checking_onData(self, msg) {
    if (msg.state == "working") {
        scheduleBuildCheck(
            self
        )
        self.state = "Working";
    } else {
        self.target.onData(msg)
        self.state = null;
    }
}

function Builder_Checking_onError(self, msg) {
    onBuilderError(self, msg)
    self.state = null;
}

function Builder_Created_default(self, msg) {
    self.state = "Created";
}

function Builder_Created_onData(self, msg) {
    startBuild(
        self
    )
    self.state = "Starting";
}

function Builder_Starting_cancelBuild(self, msg) {
    stopBuild(
        self
    )
    self.state = null;
}

function Builder_Starting_onData(self, msg) {
    self.url = msg.url
    scheduleBuildCheck(
        self
    )
    self.state = "Working";
}

function Builder_Starting_onError(self, msg) {
    onBuilderError(self, msg)
    self.state = null;
}

function Builder_Working_cancelBuild(self, msg) {
    stopBuild(
        self
    )
    self.state = null;
}

function Builder_Working_timeout(self, msg) {
    checkBuild(
        self
    )
    self.state = "Checking";
}

function DashboardShower_GettingProjects_onData(self, data) {
    showDashboard()
    complete(self, data)
    self.state = null;
}

function DashboardShower_GettingProjects_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function DashboardShower_Start_onData(self, data) {
    startMachine(
        new SpacesLoader(),
        null,
        self
    )
    self.state = "GettingProjects";
}

function DashboardShower_Start_onError(self, data) {
    self.state = null;
}

function DescriptionChanger_GetFolder_onData(self, data) {
    var parsed
    self.id = data
    parsed = parseId(self.id)
    self.folderId = parsed.folderId
    self.spaceId = parsed.spaceId
    var payload = {
        id : self.id,
        src : "DescriptionChanger"
    }
    browser.showWorking()
    startMachine(
        new FolderGetter(),
        payload,
        self
    )
    self.state = "ShowDialog";
}

function DescriptionChanger_GetFolder_onError(self, data) {
    self.state = null;
}

function DescriptionChanger_Saving_onData(self, data) {
    browser.hideWorking()
    browser.hideInputBox()
    complete(self, null)
    self.state = null;
}

function DescriptionChanger_Saving_onError(self, data) {
    browser.hideWorking()
    var message = makeErrorMessage(
        data
    )
    browser.setInputBoxError(
        message
    )
    self.state = "UserInput";
}

function DescriptionChanger_ShowDialog_onData(self, data) {
    browser.hideWorking()
    var old = data.description || ""
    var title = translate("MES_EDIT_DESCRIPTION")
    var onSave = function(desc) {
        self.onData(desc)
    }
    browser.showInputBox(
        true,
        title,
        old,
        onSave,
        null,
        false
    )
    self.state = "UserInput";
}

function DescriptionChanger_ShowDialog_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function DescriptionChanger_UserInput_onData(self, data) {
    browser.showWorking()
    var payload = {
        description : data
    }    
    backend.updateFolder(
        self.spaceId,
        self.folderId,
        payload
    ).then(self.onData).catch(self.onError)
    self.state = "Saving";
}

function DescriptionChanger_UserInput_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function DiaPropChanger_GetProps_onData(self, data) {
    self.id = data
    var parsed = parseId(self.id)
    self.spaceId = parsed.spaceId
    self.folderId = parsed.folderId
    var folder = getFromCache(self.id)
    self.name = folder.name
    self.ro = isReadonlyAccess(folder)
    if (folder) {
        sendGetFolder(
            self.spaceId,
            self.folderId,
            self
        )
        self.state = "SetModuleProps";
    } else {
        self.state = null;
    }
}

function DiaPropChanger_GetProps_onError(self, data) {
    self.state = null;
}

function DiaPropChanger_SaveProps_cancel(self, data) {
    browser.hideCentral()
    self.state = null;
}

function DiaPropChanger_SaveProps_onData(self, data) {
    browser.hideCentral()
    sendSaveDiagramProps(
        self.spaceId,
        self.folderId,
        data,
        self
    )
    self.state = "Saved";
}

function DiaPropChanger_SaveProps_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function DiaPropChanger_Saved_onData(self, data) {
    if (self.id == globs.current.id) {
        reloadDiagram()
    }
    complete(self, data)
    self.state = null;
}

function DiaPropChanger_Saved_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function DiaPropChanger_SetModuleProps_onData(self, data) {
    browser.showChangeDiaProps(
        self,
        self.name,
        data,
        self.ro
    )
    self.state = "SaveProps";
}

function DiaPropChanger_SetModuleProps_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function DiagramCreator_ChooseDiagramType_cancel(self, data) {
    browser.hideCentral()
    complete(self, data)
    self.state = null;
}

function DiagramCreator_ChooseDiagramType_onData(self, data) {
    var folder
    self.parentId = data.parentId
    self.diagramType = data.type
    var parsed = parseId(
        self.parentId
    )
    self.spaceId = parsed.spaceId
    self.parentFolder = parsed.folderId
    folder = getFromCache(
        data.parentId
    )
    self.language = folder.language
    browser.hideCentral()
    showCreateDialog(
        self.diagramType,
        self,
        folder.language
    )
    self.state = "EnterName";
}

function DiagramCreator_ChooseDiagramType_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function DiagramCreator_Done_onData(self, data) {
    complete(self, data)
    self.state = null;
}

function DiagramCreator_Done_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function DiagramCreator_EnterName_onData(self, data) {
    browser.showWorking()
    sendCreateFolder(
        self.spaceId,
        self.parentFolder,
        self.diagramType,
        self.name,
        self,
        self.language
    )
    self.state = "SendToServer";
}

function DiagramCreator_EnterName_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function handleDiagramCreationError(self, message) {
    browser.setInputBoxError(
        translate(message)
    )
    browser.hideWorking()
    self.state = "EnterName"
    return
}

function DiagramCreator_SendToServer_onData(self, data) {
    if (data.error) {
        handleDiagramCreationError(self, data.error)
        return
    }
    browser.hideInputBox()
    var onDone = function() {
        self.onData(null)
    }
    var id = makeId(
        self.spaceId,
        data.folder_id
    )
    goToFolder(
        id,
        onDone
    )
    self.state = "Done";
}

function DiagramCreator_SendToServer_onError(self, data) {
    handleDiagramCreationError(self, data.message)
}

function DiagramSearch_Folders_onData(self, data) {
    var found = {
        folders : data.folders.map(toFoundFolder),
        completed : false
    }
    browser.addToSearchList(
        found
    )
    startSearchItems(
        self.input,
        self
    )
    self.state = "ItemsPause";
}

function DiagramSearch_Folders_onError(self, data) {
    browser.cancelSearch()
    self.state = null;
}

function DiagramSearch_ItemsPause_onData(self, data) {
    sendGetSearch(
        self
    )
    self.state = "Items";
}

function DiagramSearch_ItemsPause_onError(self, data) {
    browser.cancelSearch()
    self.state = null;
}

function DiagramSearch_Items_onData(self, data) {
    var found = {
        allItems : toAllItems(data, self.input),
        completed : data.completed
    }
    browser.addToSearchList(
        found
    )
    if (data.completed) {
        self.state = null;
    } else {
        scheduleNextStateAfter(
            self,
            null,
            Config.SEARCH_PERIOD
        )
        self.state = "ItemsPause";
    }
}

function DiagramSearch_Items_onError(self, data) {
    browser.cancelSearch()
    self.state = null;
}

function DiagramSearch_Start_default(self, data) {
    self.state = "Start";
}

function DiagramSearch_Start_onData(self, data) {
    startSearchFolders(
        self.input,
        self
    )
    self.state = "Folders";
}

function DrakonRenamer_Reloaded_onData(self, data) {
    complete(self, data)
    self.state = null;
}

function DrakonRenamer_Reloaded_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function DrakonRenamer_SaveNewName_default(self, data) {
    self.state = "SaveNewName";
}

function DrakonRenamer_SaveNewName_onData(self, data) {
    self.data = data
    sendRename(
        self,
        self.data.spaceId,
        self.data.folderId,
        self.data.name
    )
    self.state = "SavingChanges";
}

function DrakonRenamer_SavingChanges_onData(self, data) {
    if (data && data.error) {
        forwardError(self, data)
        self.state = null;
        return
    }
    if (globs.current.id == self.data.id) {
        cancelPolling()
        globs.saver = null
        startMachine(
            new FolderShower(),
            self.data.id,
            self
        )
        self.state = "Reloaded";
    } else {
        complete(self, data)
        self.state = null;
    }
}

function DrakonRenamer_SavingChanges_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function DullSearch_Dummy_onInput(self, data) {
    self.state = "Start";
}

function DullSearch_Dummy_stop(self, data) {
    self.state = "Start";
}

function DullSearch_Start_dummy(self, data) {
    self.state = "Dummy";
}

function DullSearch_Start_onInput(self, data) {
    self.widgetId = data.widgetId
    var defs = [
    	{
    		id: "folders",
    		name: translate("MES_FOLDERS"),
    		items: []
    	}
    ]
    var start = {
    	folders: spacesSearchItems(data.input),
    	completed: true
    }
    browser.createSearchList(
    	self.widgetId,
    	defs,
    	start
    )
    self.state = "Start";
}

function DullSearch_Start_stop(self, data) {
    self.state = null;
}

function FolderCreatorGeneric_CreateFolder_onData(self, data) {
    self.spaceId = data.spaceId
    self.parentFolder = data.parentFolder
    self.parentId = data.parentId
    self.folderType = data.folderType
    browser.showWorking()
    sendCreateFolder(
        data.spaceId,
        data.parentFolder,
        data.folderType,
        data.name,
        self
    )
    if (data.props) {
        self.props = data.props
        self.state = "SaveProps";
    } else {
        self.state = "Expand";
    }
}

function FolderCreatorGeneric_CreateFolder_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function FolderCreatorGeneric_CreateMain_onData(self, data) {
    var props
    props = {
        name : "main",
        type : "drakon",
        keywords : {"export":true,"function":true}
    }
    sendCreateDiagram(
        self.spaceId,
        self.id,
        props,
        self
    )
    self.state = "Expand";
}

function FolderCreatorGeneric_CreateMain_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function FolderCreatorGeneric_Done_onData(self, data) {
    complete(self, data)
    self.state = null;
}

function FolderCreatorGeneric_Done_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function FolderCreatorGeneric_Expand_onData(self, data) {
    if (data.error) {
        forwardError(self, data)
        return
    }
    browser.hideInputBox()
    var machine, start
    if (data.folder_id) {
        self.folderId = makeId(
            self.spaceId,
            data.folder_id
        )
    }
    machine = new TreeNodeExpander()
    start = {
        rowId : self.parentId
    }
    startMachine(
        machine,
        start,
        self
    )
    self.state = "RefreshParent";
}

function FolderCreatorGeneric_Expand_onError(self, data) {
    forwardError(self, data)
}

function FolderCreatorGeneric_RefreshParent_onData(self, data) {
    var onDone = function() {
        self.onData(null)
    }
    getWidget("tree").expand(
        self.parentId
    )
    goToFolder(
        self.folderId,
        onDone
    )
    self.state = "Done";
}

function FolderCreatorGeneric_RefreshParent_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function FolderCreatorGeneric_SaveProps_onData(self, data) {
    self.id = data.folder_id
    self.folderId = makeId(
        self.spaceId,
        data.folder_id
    )
    sendSaveFolderProps(
        self.spaceId,
        data.folder_id,
        self.props,
        self
    )
    if (self.folderType === "module") {
        self.state = "CreateMain";
    } else {
        self.state = "Expand";
    }
}

function FolderCreatorGeneric_SaveProps_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function FolderCreator_CreateFolder_cancel(self, data) {
    browser.hideWorking()
    browser.hideCentral()
    complete(self, data)
    self.state = null;
}

function FolderCreator_CreateFolder_onData(self, data) {
    browser.hideCentral()
    self.props = data
    startMachine(
        new FolderCreatorGeneric(),
        self,
        self
    )
    self.state = "Done";
}

function FolderCreator_CreateFolder_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function FolderCreator_Done_onData(self, data) {
    if (data && data.error) {
        handleDiagramCreationError(self, data.error)
        self.state = "CreateFolder"
        return
    }    
    browser.hideWorking()
    complete(self, data)
    self.state = null;
}

function FolderCreator_Done_onError(self, data) {
    handleDiagramCreationError(self, data.message || data.error)
    self.state = "CreateFolder"
}

function FolderCreator_EnterName_onData(self, data) {
    var folder
    self.parentId = data.parentId
    self.folderType = data.type
    var parsed = parseId(
        self.parentId
    )
    self.spaceId = parsed.spaceId
    self.parentFolder = parsed.folderId
    folder = getFromCache(
        data.parentId
    )
    browser.hideCentral()
    showCreateDialog(
        self.folderType,
        self,
        folder.language
    )
    if (self.folderType == "module") {
        self.state = "SetModuleProps";
    } else {
        self.state = "CreateFolder";
    }
}

function FolderCreator_EnterName_onError(self, data) {
    self.state = null;
}

function FolderCreator_SetModuleProps_onData(self, data) {
    browser.showChangeFolderProps(
        self,
        self.name,
        {},
        "MES_CREATE",
        Utils.copyObject(globs.user.props),
        false
    )
    self.state = "CreateFolder";
}

function FolderCreator_SetModuleProps_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function FolderCutterDeleter_GettingHistory_onData(self, data) {
    resetCutFolders()
    var currentDeleted = deleteFoldersFromUi(
        self.folders
    )
    if (self.cut) {        
        self.folders.forEach(onCut)
    } else {
        self.folders.forEach(onDelete)
    }    
    if (currentDeleted) {
        goToFolder(
            self.parentId,
            self.onData
        )
    } else {
        scheduleNextState(
            self,
            null
        )
    }
    self.state = "Reloading";
}

function FolderCutterDeleter_GettingHistory_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function FolderCutterDeleter_Reloading_onData(self, data) {
    complete(self, null)
    self.state = null;
}

function FolderCutterDeleter_Reloading_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function FolderCutterDeleter_RunningOperation_onData(self, data) {
    if (!self.cut) {
        data.deleted.forEach(deleteFolderInNav)
    }
    startMachine(
        new RecentGetter(),
        null,
        self
    )
    self.state = "GettingHistory";
}

function deleteFolderInNav(folderId) {
    var id = makeId(gSpaceId, folderId)
    Nav.onDeleteFolder(id)
}

function FolderCutterDeleter_RunningOperation_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function FolderCutterDeleter_Start_onData(self, data) {
    var type
    self.folders = data.folders
    self.parentId = data.parentId
    self.cut = data.cut
    if (self.cut) {
        type = getFolderCategory(
            data.folders[0]
        )
        globs.clipboard.copyToClipboard(
            "cut-" + type,
            data.folders
        )
        scheduleNextState(
            self,
            null
        )
        self.state = "RunningOperation";
    } else {
        browser.hideWorking()
        hidePopups()
        var dialog = makeSureDelete()
        browser.createCentral(dialog, self)
        self.state = "Sure1";
    }
}

function FolderCutterDeleter_Start_onError(self, data) {
    self.state = "Start";
}

function FolderCutterDeleter_Sure1_cancel(self, data) {
    browser.hideCentral()
    complete(self, data)
    self.state = null;
}

function FolderCutterDeleter_Sure1_onData(self, data) {
    browser.hideCentral()
    sendDelete(
        self.folders,
        self
    )
    self.state = "RunningOperation";
}

function FolderCutterDeleter_Sure1_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function FolderGetter_GettingFolder_onData(self, data) {
    CallTrace.add(
        "on folder data",
        [self.id, self.src]
    )
    addToCache(self.id, data, null)
    complete(self, data)
    self.state = null;
}

function FolderGetter_GettingFolder_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function FolderGetter_Start_onData(self, data) {
    self.id = data.id
    self.src = data.src
    self.ids = parseId(self.id)
    backend.getFolder(
    	self.ids.spaceId,
    	self.ids.folderId
    ).then(self.onData).catch(self.onError)
    self.state = "GettingFolder";
}

function FolderGetter_Start_onError(self, data) {
    self.state = null;
}

function FolderShower_GettingFolder_onData(self, data) {
    showFolderCommon(
        self.id,
        data
    )
    if (canContainChildren(globs.current)) {
        setActiveScreen(
            "middle_folder",
            data.access
        )
        showFolderInGrid(data)
        complete(self, data)
        self.state = null;
    } else {
        if (globs.current.type === "app") {
            setActiveScreen(
                "middle_app",
                data.access
            )
            showApp(data)
            complete(self, data)
            self.state = null;
        } else {
            addToRecent(self.id, data)
            self.diagram = data
            if (gUserId) {
                requestTheme(self)
            } else {
                scheduleNextState(
                	self,
                	null
                )
            }
            self.state = "GettingTheme";
        }
    }
}

function FolderShower_GettingFolder_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function FolderShower_GettingTheme_onData(self, data) {
    if (data) {
        saveUserPropsInMem(data)
        getEditor().setUserSettings(data)
    }
    startMachine(
    	new FontLoadingMachine(),
    	self.diagram,
    	self
    )
    self.state = "LoadingFonts";
}

function FolderShower_GettingTheme_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function FolderShower_LoadingFonts_onData(self, data) {
    setTag(self.diagram)
    globs.saver = createSaver(self.diagram.tag)
    getEditor().resetMode()
    setActiveScreen(
        "middle_diagram",
        self.diagram.access
    )
    setDiagram(self)
    globs.saver.loaded(self.diagram)
    complete(self, self.diagram)
    self.state = null;
}

function FolderShower_LoadingFonts_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function FolderShower_Start_onData(self, data) {
    self.id = data
    var getArgs = {
        id : self.id,
        src : "FolderShower"
    }
    startMachine(
        new FolderGetter(),
        getArgs,
        self
    )
    self.state = "GettingFolder";
}

function FolderShower_Start_onError(self, data) {
    self.state = null;
}

function FontLoadingMachine_OnFont_onData(self, data) {
    if (hasMoreFontsToLoad(self)) {
        loadNextFont(self)
        self.state = "OnFont";
    } else {
        scheduleNextStateAfter(
        	self,
        	null,
        	2
        )
        self.state = "Sleeping";
    }
}

function FontLoadingMachine_OnFont_onError(self, data) {
    self.target.onError(data)
    self.state = null;
}

function FontLoadingMachine_Sleeping_onData(self, data) {
    self.target.onData(null)
    self.state = "OnFont";
}

function FontLoadingMachine_Sleeping_onError(self, data) {
    self.state = null;
}

function FontLoadingMachine_Start_onData(self, data) {
    self.fonts = getEditor().getFonts(
    	data
    )
    self.fontId = 0
    if (hasMoreFontsToLoad(self)) {
        loadNextFont(self)
        self.state = "OnFont";
    } else {
        scheduleNextStateAfter(
        	self,
        	null,
        	2
        )
        self.state = "Sleeping";
    }
}

function FontLoadingMachine_Start_onError(self, data) {
    self.target.onError(data)
    self.state = null;
}

function GenUrlShower_Done_cancel(self, msg) {
    browser.hideCentral()
    self.state = null;
}

function GenUrlShower_Done_onData(self, msg) {
    self.state = null;
}

function GenUrlShower_Done_onError(self, msg) {
    forwardError(self, data)
    self.state = null;
}

function GenUrlShower_GetUrl_onData(self, msg) {
    var parsed, url
    parsed = parseId(msg)
    url = "/api/gentoken/" + parsed.spaceId
    self.spaceId = parsed.spaceId
    self.folder = getFromCache(msg)
    self.name = self.folder.name
    browser.sendGet(
        url,
        self
    )
    self.state = "ShowUrl";
}

function GenUrlShower_GetUrl_onError(self, msg) {
    forwardError(self, data)
    self.state = null;
}

function GenUrlShower_ShowUrl_onData(self, msg) {
    var url, url1, url2
    console.log("showUrl", self.folder)
    if (self.folder.mformat === "MES_PROGRAM") {
        url1 = "/gen/" + msg.gentoken +
          "/" + self.name + "/index.js"
        url2 = "/gen/" + msg.gentoken +
          "/" + self.name + "/package.json"
        url = [url1, url2]
    } else {
        url = ["/gen/" + msg.gentoken +
          "/" + self.name + ".js"]
    }
    browser.showUrlScreen(
        self.name,
        url,
        self
    )
    self.state = "Done";
}

function GenUrlShower_ShowUrl_onError(self, msg) {
    forwardError(self, data)
    self.state = null;
}

function GoToFolderMachine_Done_onData(self, data) {
    selectTreeItem(self.id)
    complete(self, null)
    self.state = null;
}

function GoToFolderMachine_Done_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function GoToFolderMachine_Expanding_onData(self, data) {
    var success = expandOne(self, data)
    if (success) {
        self.current++
        var allDone = expandMany(self)
        if (allDone) {
            scheduleNextState(self, null)
            self.state = "Done";
        } else {
            self.state = "Expanding";
        }
    } else {
        complete(self, null)
        self.state = null;
    }
}

function GoToFolderMachine_Expanding_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function GoToFolderMachine_ShowingFolder_onData(self, data) {
    self.path = convertPathToIds(data.path)
    self.current = 1
    var tree = getWidget("tree")
    if (tree.hasItem(self.path[0])) {
        var allDone = expandMany(self)
        if (allDone) {
            scheduleNextState(self, null)
            self.state = "Done";
        } else {
            self.state = "Expanding";
        }
    } else {
        complete(self, null)
        self.state = null;
    }
}

function GoToFolderMachine_ShowingFolder_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function GoToFolderMachine_Start_onData(self, data) {
    self.id = data.id
    startMachine(
        createFolderShower(true),
        data.id,
        self
    )
    self.state = "ShowingFolder";
}

function GoToFolderMachine_Start_onError(self, data) {
    self.state = null;
}

function InputThrottle_Idle_default(self, data) {
    self.state = null;
}

function InputThrottle_Idle_onInput(self, data) {
    self.input = data.input
    if (self.input) {
        if (self.input.length > 1) {
            self.timerId = browser.schedule(
                self,
                AddUserMs
            )
            self.state = "Waiting";
        } else {
            self.state = "Idle";
        }
    } else {
        self.state = "Idle";
    }
}

function InputThrottle_Waiting_onInput(self, data) {
    self.input = data.input
    browser.clearTimeout(
        self.timerId
    )
    if (self.input) {
        if (self.input.length > 1) {
            self.timerId = browser.schedule(
                self,
                AddUserMs
            )
            self.state = "Waiting";
        } else {
            self.state = "Idle";
        }
    } else {
        self.state = "Idle";
    }
}

function InputThrottle_Waiting_timeout(self, data) {
    createSearch(self.input)
    self.state = "Idle";
}

function LoginMachine_Dialog_cancel(self, data) {
    browser.hideCentral()
    cancelTarget(self)
    self.state = "Start";
}

function LoginMachine_Dialog_login(self, data) {
    self.userId = data.id
    browser.showWorking()
    saveTry(self)
    self.state = "Saving";
}

function LoginMachine_Saving_onData(self, data) {
    browser.preventQuestion()
    hardGoToFolder(
        self.userId,
        data.diagram_id
    )
    self.state = null;
}

function LoginMachine_Saving_onError(self, data) {
    panic(data)
    self.state = null;
}

function LoginMachine_Start_default(self, data) {
    self.state = "Start";
}

function LoginMachine_Start_onData(self, data) {
    browser.showLogon(self)
    self.state = "Dialog";
}

function ObjectCreator_ChooseObjectType_cancel(self, msg) {
    browser.hideCentral()
    self.state = null;
}

function ObjectCreator_ChooseObjectType_onData(self, msg) {
    var data, machine, target
    target = makeTarget(
        function() {},
        panic
    )
    data = {
        type : msg,
        parentId : self.parentId
    }
    if (msg === "drakon") {
        machine = new DiagramCreator()
    } else {
        machine = new FolderCreator()
    }
    startMachine(
        machine,
        data,
        target
    )
    self.state = null;
}

function ObjectCreator_Start_default(self, msg) {
    self.state = "Start";
}

function ObjectCreator_Start_onData(self, msg) {
    var choice
    self.parentId = getCurrentParent(
        msg
    )
    if (self.parentId) {
        choice = getChildObjectTypes(
            self.parentId
        )
        if (choice.length == 0) {
            self.state = null;
        } else {
            browser.showChooseObjectTypeDialog(
                self,
                choice
            )
            self.state = "ChooseObjectType";
        }
    } else {
        self.state = null;
    }
}

function OwnSaver_Dialog_cancel(self, data) {
    browser.hideCentral()
    self.state = "Start";
}

function OwnSaver_Dialog_login(self, data) {
    startMachine(
        new LoginMachine(),
        null,
        self
    )
    self.state = "Subdialog";
}

function OwnSaver_Dialog_signup(self, data) {
    startMachine(
        new SignupMachine(),
        null,
        self
    )
    self.state = "Subdialog";
}

function OwnSaver_Start_default(self, data) {
    self.state = "Start";
}

function OwnSaver_Start_onData(self, data) {
    browser.showLogonSignup(self)
    self.state = "Dialog";
}

function OwnSaver_Subdialog_cancel(self, data) {
    browser.showLogonSignup(null)
    self.state = "Dialog";
}

function OwnSaver_Subdialog_onData(self, data) {
    self.state = null;
}

function PaneStatus_Hidden_show(self, msg) {
    self.showPane()
    self.state = "Visible";
}

function PaneStatus_Hidden_tab(self, msg) {
    msg.visible = true
    self.state = "Hidden";
}

function PaneStatus_Visible_hide(self, msg) {
    self.hidePane()
    self.state = "Hidden";
}

function PaneStatus_Visible_tab(self, msg) {
    msg.visible = false
    self.state = "Visible";
}

function Paster_GettingHistory_onData(self, data) {
    var payload
    if (self.parentId == globs.current.id) {
        startMachine(
            new FolderShower(),
            self.parentId,
            self
        )
    } else {
        payload = {
            id : self.parentId,
            src : "Paster"
        }
        startMachine(
            new FolderGetter(),
            payload,
            self
        )
    }
    self.state = "Reloading";
}

function Paster_GettingHistory_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function Paster_Reloading_onData(self, data) {
    setTreeChildren(data)
    getWidget("tree").expand(
        self.parentId
    )
    complete(self, null)
    self.state = null;
}

function Paster_Reloading_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function Paster_RunningCopy_onData(self, data) {
    sendDelete(
        self.folders,
        self
    )
    self.state = "RunningOperation";
}

function Paster_RunningCopy_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function Paster_RunningOperation_onData(self, data) {
    if (data.error) {
        browser.showNotification(data.error)
    }
    startMachine(
        new RecentGetter(),
        null,
        self
    )
    self.state = "GettingHistory";
}

function Paster_RunningOperation_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function Paster_Start_onData(self, data) {
    self.parentId = data.parentId
    self.folders = data.folders
    if ((data.operation == "move") && (differentProjects(data.folders[0], data.parentId))) {
        runManyOperation(
            data.parentId,
            data.folders,
            "copy",
            self
        )
        self.state = "RunningOperation";
    } else {
        runManyOperation(
            data.parentId,
            data.folders,
            data.operation,
            self
        )
        self.state = "RunningOperation";
    }
}

function Paster_Start_onError(self, data) {
    self.target.onData(null)
    self.state = null;
}

function ProjectCreator_Creating_onData(self, data) {
    browser.goToUrl(self.url)
    self.state = null;
}

function ProjectCreator_Creating_onError(self, data) {
    browser.hideWorking()
    if ((data.error == "ERR_SPACE_LIMIT") && (data.suggested)) {
        browser.hideInputBox()
        browser.suggest(
            data.error,
            data.suggested,
            "createProject"
        )
    } else {
        var message = makeErrorMessage(data)
        browser.setInputBoxError(message)
    }
    self.state = "EnterName";
}

function ProjectCreator_EnterName_onData(self, data) {
    data = makeSpaceName(data)
    browser.showWorking()
    self.url = "/" + IDE + "/doc/" + data + "/1"
    var payload = {
        name : data
    }
    browser.sendPost(
        "/api/space",
        payload,
        self
    )
    self.state = "Creating";
}

function ProjectCreator_EnterName_onError(self, data) {
    panic(data)
    self.state = null;
}

function ProjectCreator_Start_onData(self, data) {
    var onSave = function(text) {
        self.onData(text)
    }
    browser.showInputBox(
        true,
        translate("MES_CREATE_SPACE"),
        "",
        onSave,
        validateSpaceName,
        true
    )
    self.state = "EnterName";
}

function ProjectCreator_Start_onError(self, data) {
    self.state = null;
}

function ProjectDeleter_Deleting_onData(self, data) {
    browser.goToUrl(ProjectsPath)
    self.state = null;
}

function ProjectDeleter_Deleting_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function ProjectDeleter_Start_onData(self, data) {
    self.spaceId = data
    var dialog = makeSure1(self.spaceId)
    browser.createCentral(dialog, self)
    self.state = "Sure1";
}

function ProjectDeleter_Start_onError(self, data) {
    self.state = "Start";
}

function ProjectDeleter_Sure1_cancel(self, data) {
    browser.hideCentral()
    complete(self, data)
    self.state = null;
}

function ProjectDeleter_Sure1_onData(self, data) {
    browser.hideCentral()
    browser.schedule(self, 1000)
    browser.showWorking()
    self.state = "Waiting";
}

function ProjectDeleter_Sure1_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function ProjectDeleter_Sure2_cancel(self, data) {
    browser.hideCentral()
    complete(self, data)
    self.state = null;
}

function ProjectDeleter_Sure2_onData(self, data) {
    browser.hideCentral()
    browser.showWorking()
    browser.sendDelete(
        "/api/space/" + self.spaceId,
        self
    )
    self.state = "Deleting";
}

function ProjectDeleter_Sure2_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function ProjectDeleter_Waiting_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function ProjectDeleter_Waiting_timeout(self, data) {
    browser.hideWorking()
    var dialog = makeSure2(self.spaceId)
    browser.createCentral(dialog, self)
    self.state = "Sure2";
}

function ProjectLoader_ChoosingFile_cancel(self, data) {
    browser.hideCentral()
    complete(self, data)
    self.state = null;
}

function ProjectLoader_ChoosingFile_onData(self, data) {
    browser.hideCentral()
    self.file = data
    var dialog = makeSureLoad(self.spaceId)
    browser.createCentral(dialog, self)
    self.state = "Confirm";
}

function ProjectLoader_ChoosingFile_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function ProjectLoader_Confirm_cancel(self, data) {
    browser.hideCentral()
    complete(self, data)
    self.state = null;
}

function ProjectLoader_Confirm_onData(self, data) {
    browser.hideCentral()
    browser.showWorking()

    self.state = "Loading";

    var reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result; // The file's text content

        // You can also use the text variable for further processing
        var project
        try {
            project = dtAppInjector.parseJsonlProject(text)
        } catch (ex) {
            self.state = "Start";
            browser.hideWorking()
            browser.showNotification(ex.message)            
            return
        }
        self.onData(project)
    };

    // Define the onerror callback
    reader.onerror = function(e) {
        self.state = "Start";
        browser.hideWorking()
        browser.showNotification(e.message)
    };

    // Read the file as text using UTF-8 encoding
    reader.readAsText(self.file, 'UTF-8');
}

function ProjectLoader_Confirm_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function ProjectLoader_Loading_onData(self, data) {
    browser.hideWorking()
    dtAppInjector.loadProject(gSpaceId, data)
        .then(() => {
            sv_folder(gSpaceId, "1")
        }).catch(ex=> {
            forwardError(self, ex)
        })
    self.state = null;
}

function ProjectLoader_Loading_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function ProjectLoader_Start_onData(self, data) {
    self.spaceId = data
    browser.showLoadFromFile(
    	self
    )
    self.state = "ChoosingFile";
}

function ProjectLoader_Start_onError(self, data) {
    self.state = "Start";
}

function ProjectSaver_BuildingZip_onData(self, data) {
    browser.hideWorking()
    browser.downloadFile(
    	data.url,
    	data.filename
    )
    complete(self, data)
    self.state = null;
}

function ProjectSaver_BuildingZip_onError(self, data) {
    browser.hideWorking()
    panic(data)
    self.state = null;
}

function ProjectSaver_SaveScreen_cancel(self, data) {
    browser.hideCentral()
    complete(self, data)
    self.state = null;
}

function ProjectSaver_SaveScreen_onData(self, data) {
    var url = "/api/backup/" + self.spaceId
    browser.hideCentral()
    browser.showWorking()
    browser.sendGet(
    	url,
    	self
    )
    self.state = "BuildingZip";
}

function ProjectSaver_SaveScreen_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function ProjectSaver_Start_onData(self, data) {
    self.spaceId = data
    browser.showSaveProjectScreen(
        self.spaceId,
        self
    )
    self.state = "SaveScreen";
}

function ProjectSaver_Start_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function PropChanger_Done_onData(self, data) {
    browser.reload()
    complete(self, data)
    self.state = null;
}

function PropChanger_Done_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function PropChanger_GetProps_onData(self, data) {
    self.id = data
    var parsed = parseId(self.id)
    self.spaceId = parsed.spaceId
    self.folderId = parsed.folderId
    var folder = getFromCache(self.id)
    self.name = folder.name
    self.ro = isReadonlyAccess(folder)
    if (folder) {
        sendGetFolderProps(
            self.spaceId,
            self.folderId,
            self
        )
        self.state = "SetModuleProps";
    } else {
        self.state = null;
    }
}

function PropChanger_GetProps_onError(self, data) {
    self.state = null;
}

function PropChanger_SaveModuleProps_cancel(self, data) {
    browser.hideCentral()
    self.state = null;
}

function PropChanger_SaveModuleProps_onData(self, data) {
    browser.hideCentral()
    sendSaveFolderProps(
        self.spaceId,
        self.folderId,
        data,
        self
    )
    self.state = "Done";
}

function PropChanger_SaveModuleProps_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function PropChanger_SetModuleProps_onData(self, data) {
    browser.showChangeFolderProps(
        self,
        self.name,
        data,
        "MES_SAVE",
        Utils.copyObject(globs.user.props),
        self.ro
    )
    self.state = "SaveModuleProps";
}

function PropChanger_SetModuleProps_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function RecentGetter_GettingHistory_onData(self, data) {
    setHistory(data.recent)
    complete(self, data)
    self.state = null;
}

function RecentGetter_GettingHistory_onError(self, data) {
    setHistory([])
    complete(self, data)
    self.state = null;
}

function RecentGetter_Start_onData(self, data) {
    requestHistory(self)
    self.state = "GettingHistory";
}

function RecentGetter_Start_onError(self, data) {
    self.state = null;
}

function ReferencesSearch_ItemsPause_onData(self, data) {
    sendGetSearch(
        self
    )
    self.state = "Items";
}

function ReferencesSearch_ItemsPause_onError(self, data) {
    browser.cancelSearch()
    self.state = null;
}

function ReferencesSearch_Items_onData(self, data) {
    var found = {
        allItems : toAllItems(data, self.input),
        completed : data.completed
    }
    browser.addToSearchList(
        found
    )
    if (data.completed) {
        self.state = null;
    } else {
        scheduleNextStateAfter(
            self,
            null,
            Config.SEARCH_PERIOD
        )
        self.state = "ItemsPause";
    }
}

function ReferencesSearch_Items_onError(self, data) {
    browser.cancelSearch()
    self.state = null;
}

function ReferencesSearch_Start_default(self, data) {
    self.state = "Start";
}

function ReferencesSearch_Start_onData(self, data) {
    startSearchItems(
        self.input,
        self
    )
    self.state = "ItemsPause";
}

function Renamer_EnteringName_onData(self, data) {
    self.name = data
    browser.showWorking()
    if (((self.type == "drakon") || (self.type == "app")) || (self.type == "mind")) {
        CallTrace.add("rename diagram",
         [self.id, data])
        var payload = {
            name : data,
            id : self.id,
            folderId : self.folderId,
            spaceId : self.spaceId
        }
        startMachine(
            new DrakonRenamer(),
            payload,
            self
        )
    } else {
        CallTrace.add("rename folder",
         [self.id, data])
        sendRename(
            self,
            self.spaceId,
            self.folderId,
            data
        )
    }
    self.state = "SendingToServer";
}

function Renamer_EnteringName_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function Renamer_SendingToServer_onData(self, data) {
    if (data && data.error) {
        Renamer_SendingToServer_onError(self, data)
        return
    }
    browser.hideWorking()
    browser.hideInputBox()
    renameEverywhere(
        self.id,
        self.name
    )
    complete(self, null)
    self.state = null;
}

function Renamer_SendingToServer_onError(self, data) {
    browser.hideWorking()
    var message = makeErrorMessage(
        data
    )
    browser.setInputBoxError(
        message
    )
    self.state = "EnteringName";
}

function Renamer_Start_onData(self, data) {
    self.id = data
    var parsed = parseId(self.id)
    self.spaceId = parsed.spaceId
    self.folderId = parsed.folderId
    var folder = getFromCache(self.id)
    if (folder) {
        self.type = folder.type
        var title = translate("MES_RENAME_FOLDER")
        var onSave = function(text) {
            self.onData(text.trim())
        }
        showRenameDialog(
            folder,
            onSave,
            folder.language
        )
        self.state = "EnteringName";
    } else {
        self.state = null;
    }
}

function Renamer_Start_onError(self, data) {
    self.state = null;
}

function Restorer_Going_onData(self, data) {
    complete(self, data)
    self.state = null;
}

function Restorer_Going_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function Restorer_Restoring_onData(self, data) {
    var onCompleted = function() {
        self.onData(null)
    }
    goToFolder(self.id, onCompleted)
    self.state = "Going";
}

function Restorer_Restoring_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function Restorer_Start_onData(self, data) {
    self.id = data
    var parsed = parseId(self.id)
    var url = "/api/restore/" + 
    	parsed.spaceId + "/" + 
    	parsed.folderId
    browser.sendPost(
        url,
        {},
        self
    )
    self.state = "Restoring";
}

function Restorer_Start_onError(self, data) {
    self.state = null;
}

function RootFolderShower_ShowingFolder_onData(self, data) {
    complete(self, data)
    self.state = null;
}

function RootFolderShower_ShowingFolder_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function RootFolderShower_ShowingSpaces_onData(self, data) {
    startMachine(
        new GoToFolderMachine(),
        {id: self.id},
        self
    )
    self.state = "ShowingFolder";
}

function RootFolderShower_ShowingSpaces_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function RootFolderShower_Start_onData(self, data) {
    self.id = data.id
    startMachine(
        new SpacesLoader(),
        self.id,
        self
    )
    self.state = "ShowingSpaces";
}

function RootFolderShower_Start_onError(self, data) {
    self.state = null;
}

function RootRecentLoader_GettingProjects_onData(self, data) {
    showRecent()
    complete(self, data)
    self.state = null;
}

function RootRecentLoader_GettingProjects_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function RootRecentLoader_Start_onData(self, data) {
    startMachine(
        new SpacesLoader(),
        null,
        self
    )
    self.state = "GettingProjects";
}

function RootRecentLoader_Start_onError(self, data) {
    self.state = null;
}

function RootSpacesShower_GettingProjects_onData(self, data) {
    showSpacesInFolder()
    complete(self, data)
    self.state = null;
}

function RootSpacesShower_GettingProjects_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function RootSpacesShower_Start_onData(self, data) {
    startMachine(
        new SpacesLoader(),
        null,
        self
    )
    self.state = "GettingProjects";
}

function RootSpacesShower_Start_onError(self, data) {
    self.state = null;
}

function RootTrashShower_ShowingSpaces_onData(self, data) {
    startMachine(
        new TrashLoader(),
        null,
        self
    )
    self.state = "ShowingTrash";
}

function RootTrashShower_ShowingSpaces_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function RootTrashShower_ShowingTrash_onData(self, data) {
    complete(self, data)
    self.state = null;
}

function RootTrashShower_ShowingTrash_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function RootTrashShower_Start_onData(self, data) {
    startMachine(
        new SpacesLoader(),
        null,
        self
    )
    self.state = "ShowingSpaces";
}

function RootTrashShower_Start_onError(self, data) {
    self.state = null;
}

function Saver_BeforePolling_default(self, data) {
    self.state = "BeforePolling";
}

function Saver_BeforePolling_save(self, data) {
    if (canSave()) {
        cancelPolling()
        save(self, data)
        self.state = "Saving";
    } else {
        self.state = "BeforePolling";
    }
}

function Saver_BeforePolling_timeout(self, data) {
    startPoll(self)
    self.state = "Polling";
}

function Saver_Loading_default(self, data) {
    self.state = "Loading";
}

function Saver_Loading_loaded(self, data) {
    if (globs.isTryMe) {
        self.state = "Loading";
    } else {
        schedulePoll()
        self.state = "BeforePolling";
    }
}

function Saver_Loading_save(self, data) {
    if (canSave()) {
        addSaveItem(self, data)
        self.state = "Loading";
    } else {
        self.state = "Loading";
    }
}

function Saver_Polling_default(self, data) {
    self.state = "Polling";
}

function Saver_Polling_onError(self, data) {
    schedulePoll()
    self.state = "BeforePolling";
}

function Saver_Polling_onTag(self, data) {
    if (hasDifferentTag(self, data)) {
        reloadDiagram()
        self.state = "Loading";
    } else {
        schedulePoll()
        self.state = "BeforePolling";
    }
}

function Saver_Polling_save(self, data) {
    if (canSave()) {
        save(self, data)
        self.state = "Saving";
    } else {
        self.state = "Polling";
    }
}

function Saver_Saving_notSaved(self, data) {
    reloadDiagram()
    self.state = "Loading";
}

function Saver_Saving_onError(self, data) {
    reloadDiagram()
    browser.showNotification(translate(data.error || data.message))
    self.state = "Loading";
}

function Saver_Saving_save(self, data) {
    addSaveItem(self, data)
    self.state = "Saving";
}

function Saver_Saving_saved(self, data) {
    if (hasMoreToSave(self)) {
        saveNext(self)
        self.state = "Saving";
    } else {
        schedulePoll()
        self.state = "BeforePolling";
    }
}

function Sharer_Access_cancel(self, data) {
    showShareScreen(null)
    self.state = "UserInput";
}

function Sharer_Access_onData(self, data) {
    showShareScreen(null)
    self.state = "UserInput";
}

function Sharer_UserInput_access(self, data) {
    var ids = parseId(
        globs.current.id
    )
    showAccessScreen(
        ids.spaceId,
        self
    )
    self.state = "Access";
}

function Sharer_UserInput_cancel(self, data) {
    browser.hideCentral()
    self.state = null;
}

function Sharer_UserInput_onData(self, data) {
    showShareScreen(self)
    self.state = "UserInput";
}

function SignupMachineShort_Done_cancel(self, data) {
    browser.hideCentral()
    cancelTarget(self)
    self.state = null;
}

function SignupMachineShort_Done_signup(self, data) {
    browser.preventQuestion()
    browser.goToUrl("/welcome")
    self.state = null;
}

function SignupMachineShort_Start_default(self, data) {
    self.state = "Start";
}

function SignupMachineShort_Start_onData(self, data) {
    browser.showSignup(self)
    self.state = "Done";
}

function SignupMachine_Dialog_cancel(self, data) {
    browser.hideCentral()
    cancelTarget(self)
    self.state = "Start";
}

function SignupMachine_Dialog_signup(self, data) {
    self.userId = data.id
    browser.showWorking()
    saveTry(self)
    self.state = "Saving";
}

function SignupMachine_Saving_onData(self, data) {
    browser.preventQuestion()
    browser.goToUrl("/welcome")
    self.state = null;
}

function SignupMachine_Saving_onError(self, data) {
    panic(data)
    self.state = null;
}

function SignupMachine_Start_default(self, data) {
    self.state = "Start";
}

function SignupMachine_Start_onData(self, data) {
    browser.showSignup(self)
    self.state = "Dialog";
}

function SpacesLoader_GettingAccount_onData(self, data) {
    setAccount(data)
    addSpaceIfMissing(self.id)
    showSpacesInTree()
    complete(self, data)
    self.state = null;
}

function SpacesLoader_GettingAccount_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function SpacesLoader_GettingHistory_onData(self, data) {
    requestAccount(self)
    self.state = "GettingAccount";
}

function SpacesLoader_GettingHistory_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function SpacesLoader_Start_onData(self, data) {
    self.id = data
    if (gUserId) {
        startMachine(
            new RecentGetter(),
            null,
            self
        )
        self.state = "GettingHistory";
    } else {
        addSpaceIfMissing(self.id)
        showSpacesInTree()
        complete(self, data)
        self.state = null;
    }
}

function SpacesLoader_Start_onError(self, data) {
    self.state = null;
}

function ThrowTrash_GetAccount_onData(self, data) {
    browser.sendGet(
        "/api/account",
        self
    )
    self.state = "GettingAccount";
}

function ThrowTrash_GetAccount_onError(self, data) {
    self.state = null;
}

function ThrowTrash_GettingAccount_onData(self, data) {
    self.spaces = data.spaces
    self.current = 0
    browser.schedule(
        self,
        1
    )
    self.state = "Throwing";
}

function ThrowTrash_GettingAccount_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function ThrowTrash_Throwing_onData(self, data) {
    if (self.current < self.spaces.length) {
        var spaceId = self.spaces[self.current]
        rub_clearSpace(
            self,
            spaceId
        )
        self.current++
        self.state = "Throwing";
    } else {
        getWidget("trash_grid").setItems([])
        complete(self, data)
        self.state = null;
    }
}

function ThrowTrash_Throwing_onError(self, data) {
    console.log(data)
    if (self.current < self.spaces.length) {
        var spaceId = self.spaces[self.current]
        rub_clearSpace(
            self,
            spaceId
        )
        self.current++
        self.state = "Throwing";
    } else {
        getWidget("trash_grid").setItems([])
        complete(self, data)
        self.state = null;
    }
}

function ThrowTrash_Throwing_timeout(self, data) {
    if (self.current < self.spaces.length) {
        var spaceId = self.spaces[self.current]
        rub_clearSpace(
            self,
            spaceId
        )
        self.current++
        self.state = "Throwing";
    } else {
        getWidget("trash_grid").setItems([])
        complete(self, data)
        self.state = null;
    }
}

function TrashLoader_GetAccount_onData(self, data) {
    self.items = []
    browser.sendGet(
        "/api/account",
        self
    )
    self.state = "GettingAccount";
}

function TrashLoader_GetAccount_onError(self, data) {
    self.state = null;
}

function TrashLoader_GettingAccount_onData(self, data) {
    self.spaces = data.spaces
    self.current = 0
    browser.schedule(
        self,
        1
    )
    self.state = "GettingSpaceRubbish";
}

function TrashLoader_GettingAccount_onError(self, data) {
    forwardError(self, data)
    self.state = null;
}

function TrashLoader_GettingSpaceRubbish_onData(self, data) {
    rub_copyTrashItems(self, data)
    if (self.current < self.spaces.length) {
        var url = rub_getUrl(self)
        browser.sendGet(
            url,
            self
        )
        self.current++
        self.state = "GettingSpaceRubbish";
    } else {
        rub_sort(self)
        showTrash(self.items)
        complete(self, null)
        self.state = null;
    }
}

function TrashLoader_GettingSpaceRubbish_onError(self, data) {
    if (self.current < self.spaces.length) {
        var url = rub_getUrl(self)
        browser.sendGet(
            url,
            self
        )
        self.current++
        self.state = "GettingSpaceRubbish";
    } else {
        rub_sort(self)
        showTrash(self.items)
        complete(self, null)
        self.state = null;
    }
}

function TrashLoader_GettingSpaceRubbish_timeout(self, data) {
    if (self.current < self.spaces.length) {
        var url = rub_getUrl(self)
        browser.sendGet(
            url,
            self
        )
        self.current++
        self.state = "GettingSpaceRubbish";
    } else {
        rub_sort(self)
        showTrash(self.items)
        complete(self, null)
        self.state = null;
    }
}

function TreeClicker_ShowingFolder_onData(self, data) {
    complete(self, null)
    self.state = null;
}

function TreeClicker_ShowingFolder_onError(self, data) {
    putErrorOnNode(self.start.rowId)
    complete(self, null)
    self.state = null;
}

function TreeClicker_Start_onData(self, data) {
    if (data.rowId == "dashboard") {
        goToDashboard(null)
        complete(self, null)
        self.state = null;
    } else {
        if (data.rowId == "trash") {
            goToTrash(null)
            complete(self, null)
            self.state = null;
        } else {
            selectTreeItem(data.rowId)
            if (data.rowId == globs.current.id) {
                complete(self, null)
                self.state = null;
            } else {
                self.start = data
                startMachine(
                    createFolderShower(true),
                    data.rowId,
                    self
                )
                self.state = "ShowingFolder";
            }
        }
    }
}

function TreeClicker_Start_onError(self, data) {
    self.state = null;
}

function TreeNodeExpander_GettingFolder_onData(self, data) {
    setTreeChildren(data)
    complete(self, null)
    self.state = null;
}

function TreeNodeExpander_GettingFolder_onError(self, data) {
    putErrorOnNode(self.start.rowId)
    complete(self, null)
    self.state = null;
}

function TreeNodeExpander_Start_onData(self, data) {
    self.start = data
    var getArgs = {
        id : data.rowId,
        src : "TreeNodeExpander"
    }
    startMachine(
        new FolderGetter(),
        getArgs,
        self
    )
    self.state = "GettingFolder";
}

function TreeNodeExpander_Start_onError(self, data) {
    self.state = null;
}

function TryMeLoader_LoadingExample_onData(self, data) {
    self.folder = data
    startMachine(
        new FontLoadingMachine(),
        self.folder,
        self
    )
    self.state = "LoadingFonts";
}

function TryMeLoader_LoadingExample_onError(self, data) {
    self.target.onError(data)
    self.state = null;
}

function TryMeLoader_LoadingFonts_onData(self, data) {
    browser.scheduleNextStateAfter(
        self,
        null,
        100
    )
    self.state = "Sleeping";
}

function TryMeLoader_LoadingFonts_onError(self, data) {
    self.target.onError(data)
    self.state = null;
}

function TryMeLoader_Sleeping_onData(self, data) {
    closeRightPaneCore(true)
    closeLeftPaneCore(true)
    globs.current.type = self.folder.type
    getEditor().setDiagram(
    	self.folder,
    	true
    )
    setActiveScreen("middle_diagram")
    getEditor().home()
    showDemo()
    self.target.onData(null)
    self.state = null;
}

function TryMeLoader_Sleeping_onError(self, data) {
    self.target.onError(data)
    self.state = null;
}

function TryMeLoader_Start_onData(self, data) {
    var exampleUrl = browser.getExample()
    browser.sendGet(
        exampleUrl,
        self
    )
    self.state = "LoadingExample";
}

function TryMeLoader_Start_onError(self, data) {
    self.state = null;
}

function UserAdder_Primary_cancel(self, data) {
    browser.hideCentral()
    cancelTarget(self)
    self.state = null;
}

function UserAdder_Primary_choose(self, data) {
    browser.hideCentral()
    self.target.onData(data)
    self.state = null;
}

function UserAdder_Primary_onData(self, data) {
    var found = Utils.listToSet(data.found)
    var toShow = Utils.subtract(
        found,
        self.existing
    )
    toShow.sort()
    browser.setFoundUsers(toShow)
    self.state = "Primary";
}

function UserAdder_Primary_onError(self, data) {
    self.state = "Primary";
}

function UserAdder_Primary_onInput(self, data) {
    self.user = data
    if (data) {
        if (data.length > 1) {
            self.timerId = browser.schedule(
                self,
                AddUserMs
            )
            self.state = "Typing";
        } else {
            self.state = "Primary";
        }
    } else {
        browser.setFoundUsers([])
        self.state = "Primary";
    }
}

function UserAdder_Typing_cancel(self, data) {
    browser.hideCentral()
    cancelTarget(self)
    self.state = null;
}

function UserAdder_Typing_choose(self, data) {
    browser.hideCentral()
    self.target.onData(data)
    self.state = null;
}

function UserAdder_Typing_onInput(self, data) {
    self.user = data
    browser.clearTimeout(
        self.timerId
    )
    if (data) {
        if (data.length > 1) {
            self.timerId = browser.schedule(
                self,
                AddUserMs
            )
            self.state = "Typing";
        } else {
            self.state = "Primary";
        }
    } else {
        browser.setFoundUsers([])
        self.state = "Primary";
    }
}

function UserAdder_Typing_timeout(self, data) {
    startUserSearch(self.user, self)
    self.state = "Primary";
}

function accountButton(evt, type, widget, id, cellId) {
    var item, items
    items = []
    item = {
        text : ServerVars.userName,
        code : goToAccount,
        image : "user.png"
    }
    items.push(item)
    makeTextListItem(
        items,
        "Logout",
        browser.logout
    )
    browser.showPopupList(
        widget.id,
        items
    )
}

function addAccess(access, role, user) {
    var users
    users = access.roles[role]
    users[user] = true
}

function addAccessBlock(change, operation, action, before, after, spaceId) {
    var beforeUsers = before[operation]
    var afterUsers = after[operation]
    var diff = Utils.subtract(afterUsers, beforeUsers)
    diff = diff.map(function(t) {
    	return t.toLowerCase()
    })
    if (diff.length == 0) {
        
    } else {
        var block = {
        	workspace: spaceId,
        	operation: operation,
        	action: action,
        	users: diff
        }
        change.blocks.push(block)
    }
}

function addBuild(items, folder) {
    if (((folder.type == "module") && (!(folder.language == "LANG_HUMAN"))) && (!(isReadonlyAccess(folder)))) {
        makeTextListItem(
            items,
            "MES_BUILD",
            function() { buildModule(folder) },
            null,
            "build2.png"
        )
    }
}

function addGetUrl(items, folder) {
    if ((folder.type == "module") && (!(folder.language == "LANG_HUMAN"))) {
        makeTextListItem(
        	items,
        	"MES_GET_URL",
        	function() {
        		getGenUrl(folder.id)
        	}
        )
    }
}

function addNewItems(parentId, list) {
    var op, types
    var _sw86300000_ = 0;
    types = getChildObjectTypes(parentId)
    if (types.length === 0) {
        
    } else {
        var _ind8628 = 0;
        var _col8628 = types;
        var _len8628 = _col8628.length;
        while (true) {
            if (_ind8628 < _len8628) {
                
            } else {
                break;
            }
            var item = _col8628[_ind8628];
            _sw86300000_ = item.type;
            if (_sw86300000_ === "drakon") {
                op = function() {
                    createDiagramCore(parentId)
                }
            } else {
                if (_sw86300000_ === "folder") {
                    op = function() {
                        createFolderCore(parentId, "folder")
                    }
                } else {
                    if (_sw86300000_ === "app") {
                        op = function() {
                            createFolderCore(parentId, "app")
                        }
                    } else {
                        if (_sw86300000_ === "module") {
                            
                        } else {
                            throw "Unexpected switch value: " + _sw86300000_;
                        }
                        op = function() {
                            createFolderCore(parentId, "module")
                        }
                    }
                }
            }
            makeTextListItem(
                list,
                item.text,
                op,
                null,
                item.image
            )
            _ind8628++;
        }
        makeSeparator(
            list
        )
    }
}

function addPathStage(name, id, isHyper) {
    var widget
    var _ind998 = 0;
    var _col998 = globs.pathWidgets;
    var _len998 = _col998.length;
    while (true) {
        if (_ind998 < _len998) {
            
        } else {
            break;
        }
        var widgetId = _col998[_ind998];
        widget = getWidget(widgetId)
        widget.addStage(
            name,
            id,
            isHyper
        )
        _ind998++;
    }
}

function addSaveItem(saver, item) {
    if (((saver.queue.length > MaxSaveItems) && (!(globs.isTryMe))) && (!(globs.isDev))) {
        panic("ERR_COMMUNICATION")
    } else {
        saver.queue.push(item)
    }
}

function addSpaceIfMissing(id) {
    var space, spaceId, spaces
    if (id) {
        spaces = globs.user.spaces
        spaceId = parseId(id).spaceId
        if (spaceId in spaces) {
            
        } else {
            space = {
                id : "1",
                space_id : spaceId,
                is_public : true,
                access : "read",
                path : [],
                items : [],
                children : []
            }
            spaces[spaceId] = space
            addSpaceToCache(space)
        }
    }
}

function addSpaceToCache(space) {
    var id
    id = makeId(
        space.space_id,
        "1"
    )
    space.name = space.name
    space.id = "1"
    space.type = "folder"
    addToCache(id, space, null)
}

function addToCache(id, data, access) {
    var folder
    folder = globs.folders[id]
    if (folder) {
        
    } else {
        folder = {}
        globs.folders[id] = folder
    }
    Utils.mergeSets(folder, data)
    setSubtype(folder)
    if (folder.access) {
        
    } else {
        folder.access = access || "read"
    }
    if (folder.parent) {
        folder.parent = makeId(
            folder.space_id,
            folder.parent
        )
    }
    if (folder.children) {
        var _ind3569 = 0;
        var _col3569 = folder.children;
        var _len3569 = _col3569.length;
        while (true) {
            if (_ind3569 < _len3569) {
                
            } else {
                break;
            }
            var child = _col3569[_ind3569];
            child.parent = folder.id
            addToCache(
                makeId(child.space_id, child.id),
                child,
                folder.access
            )
            _ind3569++;
        }
    }
    folder.folderId = folder.id
    folder.spaceId = folder.space_id
    folder.id = id
}

function addToPrevious(ids) {
    var found, last
    last = ids[ids.length - 1]
    found = globs.current.previous.indexOf(last)
    if (found == -1) {
        globs.current.previous = ids
    }
}

function addToRecent(id, data) {
    var index, item, recent, sameId
    recent = getRecent()
    sameId = function(item) {
        return item.id == id
    }
    index = find(
        recent,
        sameId
    )
    if (index == -1) {
        
    } else {
        removeAt(
            recent,
            index
        )
    }
    data.whenOpened = (new Date()).toISOString()
    item = makeRecentObject(data)
    recent.unshift(item)
    updateHistoryList()
}

function bind(signalId, event, callback) {
    var handlers, widgetHandlers
    handlers = globs.handlers
    if (signalId in handlers) {
        
    } else {
        handlers[signalId] = {}
    }
    widgetHandlers = handlers[signalId]
    widgetHandlers[event] = callback
}

function bindEditor() {
    var editor, openLeft, openRight
    editor = getEditor()
    if ((globs.wide) && (!(globs.isTryMe))) {
        openLeft = editor.createLeftButton(
            openLeftPane,
            "right",
            "#E2EDF5"
        )
        openRight = editor.createRightButton(
            openRightPane,
            "left",
            "#E2EDF5"
        )
        globs.openLeftIndex = openLeft
        globs.openRightIndex = openRight
        editor.hideLeftButton(
            globs.openLeftIndex
        )
        editor.hideRightButton(
            globs.openRightIndex
        )
    }
}

function bindHandlers() {
    bind("left_pane_close", "click", closeLeftPane)
    bind("right_pane_close", "click", closeRightPane)
    bind("tree", "collapse", collapseTreeNode)
    bind("folderSearch", "input", onFolderSearch)
    bind("folder_grid", "click", onFolderClick)
    bind("middle_spaces", "click", onProjectClick)
    bind("check_all", "check", onCheckAll)
    bind("recent", "click", onRecentClick)
    bind("middle_recent", "click", onRecentClick)
    bind("path", "click", onRecentClick)
    bind("up", "click", goUp)
    bind("back", "click", goBack)
    bind("forward", "click", goForward)
    bind("splitter", "resize", onSplitterResize)
    bind("hideCentral", "click", hideCentral)
    bind("actions", "click", onActionsClick)
    bind("folder_grid", "contextmenu", onFoldersContext)
    bind("tree", "contextmenu", onTreeContext)
    bind("middle_spaces", "contextmenu", onProjectContext)
    bind("goToProjects", "click", goToProjectsNoArg)
    bind("trash_grid", "click", onTrashClick)
    bind("undo", "click", undo)
    bind("redo", "click", redo)
    bind("create_diagram", "click", createDiagram)
    bind("create_folder", "click", createFolder)
    bind("create", "click", create)
    bindMachine("tree", "expand", TreeNodeExpander)
    bindMachine("tree", "click", TreeClicker)
    bindMachine("clearTrash", "click", ThrowTrash)
    bind("createProject", "click", createProject)
    bind("share", "click", share)
    bind("exportButton", "click", exportButton)
    bind("accountButton", "click", accountButton)
    bind("showMainMenu", "click", showMainMenu)
    bind("saveDiagram", "click", saveDiagram)
    bind("globalSearch", "input", globalSearch)
    bind("globalSearch", "escape", globalSearchEscape)
}

function bindMachine(signalId, event, ctr) {
    var handlers, widgetHandlers
    handlers = globs.machineHandlers
    if (signalId in handlers) {
        
    } else {
        handlers[signalId] = {}
    }
    widgetHandlers = handlers[signalId]
    widgetHandlers[event] = ctr
}

function build() {
    globs.build.showBuild()
}

function buildAccessChange(old, access) {
    var hasChange = false
    var change = {
    	spaceId: access.spaceId,
    	blocks: []
    }
    if (access.isPublic == old.isPublic) {
        change.setPublicAccess = false
    } else {
        change.setPublicAccess = true
        change.publicAccess = access.isPublic
    }
    addAccessBlock(
    	change,
    	"read",
    	"grant",
    	old.roles,
    	access.roles,
    	access.spaceId
    )
    addAccessBlock(
    	change,
    	"read",
    	"revoke",
    	access.roles,
    	old.roles,
    	access.spaceId
    )
    addAccessBlock(
    	change,
    	"write",
    	"grant",
    	old.roles,
    	access.roles,
    	access.spaceId
    )
    addAccessBlock(
    	change,
    	"write",
    	"revoke",
    	access.roles,
    	old.roles,
    	access.spaceId
    )
    addAccessBlock(
    	change,
    	"admin",
    	"grant",
    	old.roles,
    	access.roles,
    	access.spaceId
    )
    addAccessBlock(
    	change,
    	"admin",
    	"revoke",
    	access.roles,
    	old.roles,
    	access.spaceId
    )
    if ((change.setPublicAccess) || (!(change.blocks.length == 0))) {
        return change
    } else {
        return null
    }
}

function buildGoToRecentItem(item) {
    return {
        text: item,
        action: function() {dtApp.tryOpenFolder(item)}
    }
}

async function buildMainMenu() {
    var showTitle = "MES_SHOW"
    var green = "green"
    var yellow = "olive"
    var blue = "blue"
    var fileItems = []
    fileItems.push({
    	text: "New window",
    	action: backend.newWindow
    })
    fileItems.push({
    	text: "Open folder",
    	action: dtApp.openFolder
    })
    fileItems.push({
    	text: "Close folder",
    	action: dtApp.closeFolder
    })
    var exportItems = [
        {
            text: "Import project",
            action: showLoadProjectFromFileDialog
        },
        {
            text: "Export project",
            action: backend.exportProject
        }
    ]
    
    var rwShotItems = []
    rwShotItems.push(
        {
            text: "MES_PROJECT_TREE",
            action: openLeftPane
        }
    )
    rwShotItems.push(
        {
            text: "MES_RECENT_PANE",
            action: openRightPane
        }
    )    

    var recent = await backend.getRecent()
    var recentItems = recent.map(buildGoToRecentItem).slice(0, 5)
    var menu = [
    	{
    		title: "Window",
    		items: fileItems,
    		color: green
    	},
    	{
    		title: "Export/Import",
    		items: exportItems,
    		color: yellow
    	},
        {
            title: showTitle,
            items: rwShotItems,
            color: blue
        }        
    ]

    if (recentItems.length !== 0) {
        menu.push({
            title: "Recent",
            items: recentItems,
            color: "coral"
        })  
    }

    return menu
}



function buildModule(folder) {
    globs.build.buildModule(folder)
}

function canContainChildren(obj) {
    var _sw72150000_ = 0;
    _sw72150000_ = obj.type;
    if (((_sw72150000_ === "folder") || (_sw72150000_ === "module")) || (_sw72150000_ === "class")) {
        return true
    } else {
        return false
    }
}

function canPasteFolder() {
    if (isReadonly()) {
        return false
    } else {
        return canPasteInto(
            globs.current.id
        )
    }
}

function canPasteInto(targetId) {
    var fromModule, target, type, underModule
    type = globs.clipboard.getClipboardType()
    if (Utils.endsWith(type, "-folder")) {
        target = getFromCache(targetId)
        if (target.type == "module") {
            underModule = true
        } else {
            underModule = hasModuleAbove(target)
        }
        if (Utils.endsWith(type, "module-folder")) {
            fromModule = true
        } else {
            fromModule = false
        }
        if (fromModule == underModule) {
            return true
        } else {
            return false
        }
    } else {
        return false
    }
}

function canSave() {
    if (((isReadonly()) || (globs.isDev)) || (globs.isTryMe)) {
        return false
    } else {
        return true
    }
}

function cancelBuild() {
    globs.build.cancelBuild()
}

function cancelPolling() {
    var timer
    timer = globs.pollTimer
    if (timer) {
        window.clearTimeout(timer)
        globs.pollTimer = null
    }
}

function cancelTarget(self) {
    if (self.target.cancel) {
        self.target.cancel()
    }
}

function changeDescription(id) {
    var target
    target = makeTarget(
        function(){},
        function(){}
    )
    startMachine(
        new DescriptionChanger(),
        id,
        target
    )
}

function changeDiagramProperties(id) {
    id =  id || globs.current.id
    startMachine(
        new DiaPropChanger(),
        id,
        null
    )
}

function changeFolderProperties(id) {
    startMachine(
        new PropChanger(),
        id,
        null
    )
}

function checkBuild(self) {
    build_check().then(self.onData).catch(self.onError)
}

function clearPath() {
    var widget
    var _ind1007 = 0;
    var _col1007 = globs.pathWidgets;
    var _len1007 = _col1007.length;
    while (true) {
        if (_ind1007 < _len1007) {
            
        } else {
            break;
        }
        var widgetId = _col1007[_ind1007];
        widget = getWidget(widgetId)
        widget.clear()
        _ind1007++;
    }
}

function clearRubbish() {
    CallTrace.add("clearRubbish", [])
    startAsync(
        new ThrowTrash(),
        null,
        null
    )
}

function closeLeftPane() {
    globs.leftPaneStatus.hide()
}

function closeLeftPaneCore(noSave) {
    var splitter
    if (globs.openLeftIndex == null) {
        
    } else {
        getEditor().showLeftButton(
            globs.openLeftIndex
        )
    }
    splitter = getWidget("splitter")
    splitter.leftVisible = false
    updateGui()
    if (noSave) {
        
    } else {
        saveSplitterValues()
    }
}

function closeRightPane() {
    globs.rightPaneStatus.hide()
}

function closeRightPaneCore(noSave) {
    var splitter
    if (globs.openRightIndex == null) {
        
    } else {
        getEditor().showRightButton(
            globs.openRightIndex
        )
    }
    splitter = getWidget("splitter")
    splitter.rightVisible = false
    updateGui()
    if (noSave) {
        
    } else {
        saveSplitterValues()
    }
}

function collapseTreeNode(evt, type, widget, id, cellId) {
    var tree
    tree = getWidget("tree")
    tree.removeChildren(
        id
    )
}

function complete(machine, data) {
    machine.target.onData(data)
}

function convertPathToIds(path) {
    var ids
    path = path || []
    ids = path.map(makeIdFromChild)
    return ids
}

function copyFolders() {
    var selected
    selected = getSelectedFolders()
    copyFoldersCore(selected)
}

function copyFoldersCore(selected) {
    var type
    resetCutFolders()
    if (selected.length == 0) {
        
    } else {
        type = getFolderCategory(
            selected[0]
        )
        globs.clipboard.copyToClipboard(
            "copy-" + type,
            selected
        )
        updateActionList()
    }
}

function create() {
    createObjectCore(null)
}

function createAccess(spaceId, data) {
    var access
    access = {
        spaceId : spaceId,
        isPublic : data["public"],
        roles : {}
    }
    access.roles.read = Utils.listToSet(data.readers)
    access.roles.write = Utils.listToSet(data.writers)
    access.roles.admin = Utils.listToSet(data.admins)
    access.add = function(role, user) {
        addAccess(access, role, user)
    }
    access.remove = function(role, user) {
        removeAccess(access, role, user)
    }
    return access
}

function createApp() {
    createFolderCore(
        null,
        "app"
    )
}

function createDiagram() {
    createDiagramCore(null)
}

function createDiagramCore(parentId) {
    var data, target
    parentId = getCurrentParent(parentId)
    if (parentId) {
        data = {
            parentId : parentId,
            type : "drakon"
        }
        target = makeTarget(
            function() {},
            panic
        )
        startMachine(
            new DiagramCreator(),
            data,
            target
        )
    }
}

function createFolder() {
    createFolderCore(
        null,
        "folder"
    )
}

function createFolderCore(parentId, type) {
    var data, machine, target
    parentId = getCurrentParent(parentId)
    if (parentId) {
        target = makeTarget(
            function() {},
            panic
        )
        machine = new FolderCreator()
        machine.browser = browser
        data = {
            type : type,
            parentId : parentId
        }
        startMachine(
            machine,
            data,
            target
        )
    }
}

function createFolderShower(home) {
    var machine
    machine = new FolderShower()
    machine.home = home
    return machine
}

function createModule() {
    createFolderCore(
        null,
        "module"
    )
}

function createObjectCore(parentId) {
    var machine
    machine = new ObjectCreator()
    startMachine(
        machine,
        parentId,
        null
    )
}

function createProject() {
    startMachine(
    	new ProjectCreator(),
    	null,
    	null
    )
}

function createSaver(tag) {
    var saver
    saver = new Saver()
    saver.queue = []
    saver.newTag = tag
    saver.oldTag = null
    return saver
}

function createSearch(input) {
    var defs, folders, items, machine, start
    var _sw66160000_ = 0;
    folders = spacesSearchItems(input)
    defs = makeDiagramSearchDefs()
    killSearchMachine()
    _sw66160000_ = globs.current.screen;
    if ((_sw66160000_ === "middle_folder") || (_sw66160000_ === "middle_app")) {
        machine = new DiagramSearch()
        items = []
        machine.input = input
        start = {
            folders : folders,
            items : items
        }
        browser.createSearchList(
            defs,
            start
        )
        startSearchMachine(machine)
    } else {
        if (_sw66160000_ === "middle_diagram") {
            machine = new DiagramSearch()
            // items = findItems(input)
            items = []
            machine.input = input
            start = {
                folders : folders,
                items : items
            }
            browser.createSearchList(
                defs,
                start
            )
            startSearchMachine(machine)
        } else {
            start = {
                folders : folders,
                completed : true
            }
            browser.createSearchList(
                defs,
                start
            )
        }
    }
}

function createState() {
    var state = {
    	user: {
    		userId: gUserId,
    		spaces: {},
    		recent: [],
    		props: {}
    	},
    	current: {
    		type: null,
    		id: null,
    		parent: null,
    		previous: []
    	},
    	loadedFonts: {},
    	handlers: {},
    	machineHandlers: {},
    	pathWidgets: [],
    	globalSearches: [],
    	nav: {
    		type: null,
    		pageId: null
    	},
    	folders: {},
    	build: new BuildManager()
    }
    state.topCodes = makeTopCodes()
    state.topCodesRo = makeTopCodesRo()
    state.topCodesNu = makeTopCodesNu()
    return state
}

function cutFolders() {
    var selected
    selected = getSelectedFolders()
    cutFoldersCore(null, selected)
}

function cutFoldersCore(parentId, selected) {
    var data
    CallTrace.add(
        "cut folders",
        [selected]
    )
    if (selected.length == 0) {
        
    } else {
        data = {
            parentId : parentId,
            folders : selected,
            cut : true
        }
        startAsync(
            new FolderCutterDeleter(),
            data,
            null
        )
    }
}

function deleteFolders() {
    var folders
    folders = getSelectedFolders()
    deleteFoldersCore(null, folders)
}

function deleteFoldersCore(parentId, selected) {
    var data
    CallTrace.add(
        "delete folders",
        [selected]
    )
    if (selected.length == 0) {
        
    } else {
        data = {
            parentId : parentId,
            folders : selected,
            cut : false
        }
        startAsync(
            new FolderCutterDeleter(),
            data,
            null
        )
    }
}

function deleteFoldersFromUi(folders) {
    var currentDeleted = isAnyCurrent(
        folders
    )    
    if (currentDeleted) {
        
    } else {
        updateActionList()
    }
    return currentDeleted
}

function deleteFromGrid(id) {
    var widget
    widget = getWidget("folder_grid")
    widget.remove(id)
}

function deleteFromHistory(id) {
    var recent, recentMiddle
    recent = getWidget("recent")
    recent.remove(id)
    recentMiddle = getWidget("middle_recent")
    recentMiddle.remove(id)
}

function deleteFromTree(id) {
    var widget
    widget = getWidget("tree")
    widget.remove(id)
}

function deleteProject(spaceId) {
    var target
    target = makeTarget(
        function() {},
        panic
    )
    startMachine(
        new ProjectDeleter(),
        spaceId,
        target
    )
}

function descriptionCheckedFolder() {
    var selected
    selected = getSelectedFolders()
    if (selected.length == 1) {
        changeDescription(
            selected[0]
        )
    }
}

function diagramBText() {
    getEditor().bText()
}

function diagramSource() {
    getEditor().loadSave(false)
}

function differentProjects(id1, id2) {
    var dstSpace, srcSpace
    srcSpace = parseId(id1).spaceId
    dstSpace = parseId(id2).spaceId
    if (srcSpace == dstSpace) {
        return false
    } else {
        return true
    }
}

function endAsync(onCompleted) {
    browser.hideWorking()
    if (onCompleted) {
        onCompleted()
    }
}

function expandMany(self) {
    var args, current, prev, tree
    while (true) {
        tree = getWidget("tree")
        if (pathCompleted(self)) {
            return true
        }
        current = self.path[self.current]
        if (tree.hasItem(current)) {
            
        } else {
            prev = self.path[self.current - 1]
            args = {
                id : prev,
                src : "expandMany"
            }
            startMachine(
                new FolderGetter(),
                args,
                self
            )
            return false
        }
        self.current++
    }
}

function expandOne(self, data) {
    var childId, id, prev, success, tree
    id = self.path[self.current]
    var _ind1457 = 0;
    var _col1457 = data.children;
    var _len1457 = _col1457.length;
    while (true) {
        if (_ind1457 < _len1457) {
            
        } else {
            success = false
            break;
        }
        var child = _col1457[_ind1457];
        childId = makeIdFromChild(child)
        if (childId == id) {
            tree = getWidget("tree")
            setTreeChildren(data)
            prev = makeIdFromChild(data)
            tree.expand(prev)
            success = true
            break;
        }
        _ind1457++;
    }
    return success
}

function exportButton(evt, type, widget, id, cellId) {
    var items
    items = []
    makeTextListItem(
    	items,
    	"MES_SAVE_AS_PNG",
    	function() { browser.saveAsPng(1) }
    )
    makeTextListItem(
    	items,
    	"MES_SAVE_AS_PNG_HI",
    	function() { browser.saveAsPng(2) }
    )
    makeTextListItem(
    	items,
    	"MES_SAVE_AS_SVG",
    	browser.saveAsSvg
    )
    browser.showPopupList(
        widget.id,
        items
    )
}

function find(array, predicate) {
    var i, item
    i = 0;
    while (true) {
        if (i < array.length) {
            
        } else {
            return -1
        }
        item = array[i]
        if (predicate(item)) {
            return i
        }
        i++;
    }
}

function findFeedbackRight() {
    var margin, splitter
    margin = 50
    splitter = getWidget("splitter")
    if (splitter.rightVisible) {
        return splitter.right + margin
    } else {
        return margin
    }
}

function findItems(input) {
    var cached, diagram, id, items, needle, path
    id = globs.current.id
    cached = getFromCache(id)
    path = getPath(cached)
    items = []
    needle = Utils.normalizeString(input).text
    diagram = getDiagram()
    scanItems(
        diagram.nodes,
        needle,
        items,
        cached.name,
        id,
        path
    )
    scanItems(
        diagram.free,
        needle,
        items,
        cached.name,
        id,
        path
    )
    return items
}

function findReferences(name) {
    var defs, machine, start
    killSearchMachine()
    defs = makeItemSearchDefs()
    start = {}
    browser.createSearchList(
        defs,
        start
    )
    machine = new ReferencesSearch()
    machine.input = name
    startSearchMachine(machine)
}

function folderComparer(left, right) {
    var leftR = getRank(left.subtype)
    var rightR = getRank(right.subtype)
    if (leftR == rightR) {
        return left.name.localeCompare(right.name)
    } else {
        if (leftR < rightR) {
            return -1
        } else {
            return 1
        }
    }
}

function foldersUnderModule(folders) {
    var folder
    var _ind8560 = 0;
    var _col8560 = folders;
    var _len8560 = _col8560.length;
    while (true) {
        if (_ind8560 < _len8560) {
            
        } else {
            return false
        }
        var id = _col8560[_ind8560];
        folder = getFromCache(id)
        if (hasModuleAbove(folder)) {
            return true
        }
        _ind8560++;
    }
}

function forwardError(self, data) {
    self.target.onError(data)
}

function getActionList(checked) {
    var folder, items
    items = []
    if (checked.length > 0) {
        makeTextListItem(
        	items,
        	"MES_COPY",
        	copyFolders
        )
        if (isReadonly()) {
            
        } else {
            makeTextListItem(
            	items,
            	"MES_CUT",
            	cutFolders
            )
            if (canPasteFolder()) {
                makeTextListItem(
                	items,
                	"MES_PASTE",
                	pasteFolders
                )
            }
            makeSeparator(
            	items
            )
            makeTextListItem(
            	items,
            	"MES_DELETE",
            	deleteFolders
            )
            if (checked.length == 1) {
                makeSeparator(
                	items
                )
                makeTextListItem(
                	items,
                	"MES_RENAME",
                	renameCheckedFolder
                )
            }
        }
    } else {
        if (canPasteFolder()) {
            makeTextListItem(
            	items,
            	"MES_PASTE",
            	pasteFolders
            )
        }
    }
    if (checked.length == 1) {

        folder = getFromCache(checked[0])
        if (folder.type == "module") {
            makeSeparator(
            	items
            )
            addGetUrl(
                items,
                folder
            )
            addBuild(
                items,
                folder
            )
            makeTextListItem(
            	items,
            	"MES_PROPERTIES",
            	function() {
            	changeFolderProperties(checked[0])
            	}
            )
        } else {
            if (folder.type == "drakon") {
                makeTextListItem(
                    items,
                    "MES_DESCRIPTION",
                    descriptionCheckedFolder
                )                
                makeSeparator(
                    items
                )
                makeTextListItem(
                	items,
                	"MES_PROPERTIES",
                	function() {
                		changeDiagramProperties(checked[0])
                	}
                )
            }
        }
    }
    if (isReadonly()) {
        
    } else {
        makeSeparator(
        	items
        )
        makeTextListItem(
        	items,
        	"MES_NEW_OBJECT",
        	create
        )
    }
    return items
}

function getAppName() {
    return translate(AppName)
}

function getChildObjectTypes(folderId) {
    var result
    var _sw73320000_ = 0;
    result = []
    var folder = getFromCache(folderId)
    if (folder) {
        _sw73320000_ = folder.type;
        if (_sw73320000_ === "folder") {
            if (hasModuleAbove(folder)) {
                result.push(
                    makeChoiceDiagram()
                )
                result.push(
                    makeChoiceFolder()
                )
            } else {
                result.push(
                    makeChoiceModule()
                )
                result.push(
                    makeChoiceApp()
                )
                result.push(
                    makeChoiceFolder()
                )
            }
        } else {
            if (_sw73320000_ === "module") {
                result.push(
                    makeChoiceDiagram()
                )
                result.push(
                    makeChoiceFolder()
                )
            } else {
                if (_sw73320000_ === "class") {
                    result.push(
                        makeChoiceDiagram()
                    )
                }
            }
        }
    }
    result.forEach(
        setImage
    )
    return result
}

function getCurrent() {
    var current, ids
    current = globs.current
    ids = {
        spaceId : null,
        folderId : null
    }
    if (current.id) {
        ids = parseId(current.id)
    }
    return {
        id: current.id,
        type : current.type,
        screen : current.screen,
        spaceId : ids.spaceId,
        folderId : ids.folderId
    }
}

function getCurrentParent(id) {
    var current
    if (id) {
        return id
    } else {
        current = globs.current
        if (current.id) {
            if (canContainChildren(current)) {
                return current.id
            } else {
                return current.parent
            }
        } else {
            return null
        }
    }
}

function getDiagram() {
    if (globs.current.screen == "middle_diagram") {
        return browser.getEditor().getDiagram()
    } else {
        return null
    }
}

function getEditor() {
    return browser.getEditor()
}

function getFolderCategory(folderId) {
    var folder, type
    folder = getFromCache(
        folderId
    )
    if (hasModuleAbove(folder)) {
        type = "module-folder"
    } else {
        type = "space-folder"
    }
    return type
}

function getFromCache(id) {
    return globs.folders[id] || null
}

function getGenUrl(id) {
    startMachine(
        new GenUrlShower(),
        id,
        null
    )
}

function getHandler(handlers, widget, type) {
    var handler, widgetHandler
    widgetHandler = handlers[widget.signalId]
    if (widgetHandler) {
        handler = widgetHandler[type]
        if (handler) {
            return handler
        } else {
            return null
        }
    } else {
        return null
    }
}

function getImage(type) {
    if (type === "txt") {
        return "list-tx.png"
    }
    if (type === "proj") {
        return "list-pj.png"
    }
    var image
    if (type === "space") {
        image = "workspace-s2.png"
    } else {
        if (type === "class") {
            image = "class.png"
        } else {
            if (type === "module") {
                image = "module.png"
            } else {
                if (type === "app") {
                    image = "app-icon.png"
                } else {
                    if (type === "folder") {
                        image = "folder-s2.png"
                    } else {
                        if (type === "drakon") {
                            image = "list-drakon2.png"
                        } else {
                            if (type === "drakon_scen") {
                                image = "list-scen.png"
                            } else {
                                if (type === "drakon_exp") {
                                    image = "list-drakon2-exp.png"
                                } else {
                                    if (type === "drakon_algoprop") {
                                        image = "list-algoprop.png"
                                    } else {
                                        if (type === "mind") {
                                            image = "list-mind.png"
                                        } else {
                                            if (type === "free") {
                                                image = "list-free.png"
                                            } else {
                                                image = "list-drakon2.png"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return image
}

function getItemsToCopy(id) {
    var checked
    checked = getSelectedFolders()
    if (checked.length == 0) {
        return [id]
    } else {
        return checked
    }
}

function getLeftSplitterVisible() {
    var cookie
    if (globs.wide) {
        cookie = HtmlUtils.getCookie("splitter-left-vis")
        return parseSplitterVisible(cookie)
    } else {
        return false
    }
}

function getLeftSplitterWidth() {
    var cookie, value
    if (globs.wide) {
        cookie = HtmlUtils.getCookie("splitter-left")
        value = parseSplitterValue(cookie)
        return value
    } else {
        return 200
    }
}

function getNormalName(folder) {
    return folder.name
}

function getParentFolder(folder) {
    if (folder.parent) {
        return getFromCache(folder.parent)
    } else {
        return null
    }
}

function getPath(folder) {
    var i, steps
    steps = [folder.space_id]
    i = 1;
    while (true) {
        if (i < folder.path.length - 1) {
            
        } else {
            break;
        }
        steps.push(folder.path[i].name)
        i++;
    }
    return steps.join("/")
}

function getRank(type) {
    if (type == "folder") {
        return 10
    } else {
        if (type == "drakon_exp") {
            return 20
        } else {
            if (type == "drakon_scen") {
                return 30
            } else {
                return 40
            }
        }
    }
}

function getRecent() {
    return globs.user.recent
}

function getRightSplitterVisible() {
    var cookie
    if (globs.wide) {
        cookie = HtmlUtils.getCookie("splitter-right-vis")
        return parseSplitterVisible(cookie)
    } else {
        return false
    }
}

function getRightSplitterWidth() {
    var cookie, value
    if (globs.wide) {
        cookie = HtmlUtils.getCookie("splitter-right")
        value = parseSplitterValue(cookie)
        return value
    } else {
        return 200
    }
}

function getSelectedFolders() {
    var folders, status
    folders = getWidget("folder_grid")
    status = folders.getChecked()
    return status.checked
}

function getSpaces() {
    var spaces
    spaces = Object.keys(globs.user.spaces)
    spaces.sort()
    return spaces
}

function getSubtype(folder) {
    if (folder.keywords) {
        if (folder.keywords["scenario"]) {
            return "drakon_scen"
        } else {
            if (folder.keywords["export"]) {
                return "drakon_exp"
            } else {
                if (folder.keywords["algoprop"]) {
                    return "drakon_algoprop"
                } else {
                    return folder.type
                }
            }
        }
    } else {
        return folder.type
    }
}

function getTime() {
    var date = new Date()
    return date.getTime()
}

function getUserProp(prop) {
    return globs.user.props[prop]
}

function getWidget(id) {
    return browser.widgets.getWidget(id)
}

function findWidgetsBySignalId(signalId) {
    return browser.widgets.findWidgetsBySignalId(signalId)
}

function globalSearch(evt, type, widget, id, cellId) {
    var input, msg
    if (globs.searchThrottle) {
        input = widget.getValue()
        input = input.trim()
        msg = {
            input : input,
            widgetId : widget.id
        }
        globs.searchThrottle.onInput(msg)
    }
}

function globalSearchEscape(evt, type, widget, id, cellId) {
    browser.cancelSearch()
}

function goHome() {
    browser.goToUrl(Root)
}

function goToAccount() {
    browser.goToUrl("/account")
}

function goToDashboard(onCompleted) {
    var tree
    willChangeScreen()
    tree = getWidget("tree")
    tree.deselect()
    showDashboard()
    browser.hideWorking()
    if (onCompleted) {
        onCompleted()
    }
}

function goToFolder(id, onCompleted) {
    var start
    if ((((id === globs.current.id) && (!(globs.current.type === "folder"))) && (!(globs.current.type === "module"))) && (!(globs.current.type === "app"))) {
        if (onCompleted) {
            browser.setTimeout(onCompleted, 1, "goToFolder")
        }
    } else {
        willChangeScreen()
        start = {
            id : id
        }
        startAsync(
            new GoToFolderMachine(),
            start,
            onCompleted
        )
    }
}

function goToItem(id, itemId) {
    var center, editor
    editor = getEditor()
    if ((isDiagram()) && (globs.current.id == id)) {
        editor.centerItem(itemId)
    } else {
        center = function() {
            editor.centerItem(itemId)
        }
        goToFolder(id, center)
    }
}

function goToProjects(onCompleted) {
    var tree
    willChangeScreen()
    tree = getWidget("tree")
    tree.deselect()
    showSpacesInFolder()
    browser.hideWorking()
    if (onCompleted) {
        onCompleted()
    }
}

function goToProjectsNoArg() {
    goToProjects(null)
}

function goToRecent(onCompleted) {
    var tree
    willChangeScreen()
    tree = getWidget("tree")
    tree.deselect()
    showRecent()
    browser.hideWorking()
    if (onCompleted) {
        onCompleted()
    }
}

function goToTrash(onCompleted) {
    willChangeScreen()
    startAsync(
        new TrashLoader(),
        null,
        onCompleted
    )
}

function goBack() {    
    Nav.back()
}

function goForward() {
    Nav.forward()
}

function goUp() {
    var parent
    parent = globs.current.parent
    if (parent) {
        goToFolder(
            parent,
            null
        )
    } else {
        goToProjects(null)
    }
}

function hardGoToFolder(userId, diagramId) {
    var url
    url = "/" + IDE + "/doc/" + userId +
    	"/" + diagramId
    browser.goToUrl(url)
}

function hasDifferentTag(saver, data) {
    var time = parseInt(data.time)
    if (time < saver.lastIo) {
        return false
    } else {
        if ((data.tag == saver.oldTag) || (data.tag == saver.newTag)) {
            return false
        } else {
            return true
        }
    }
}

function hasDrakon(folders) {
    var folder
    var _ind8531 = 0;
    var _col8531 = folders;
    var _len8531 = _col8531.length;
    while (true) {
        if (_ind8531 < _len8531) {
            
        } else {
            break;
        }
        var id = _col8531[_ind8531];
        folder = getFromCache(id)
        if ((folder) && (folder.type == "drakon")) {
            return true
        }
        _ind8531++;
    }
    return false
}

function hasModuleAbove(folder) {
    return true
}

function hasMoreFontsToLoad(self) {
    if (self.fontId < self.fonts.length) {
        return true
    } else {
        return false
    }
}

function hasMoreToSave(saver) {
    if (saver.queue.length > 0) {
        return true
    } else {
        return false
    }
}

function hideCentral() {
    browser.hideCentral()
}

function idToServerFolder(id) {
    var parsed
    parsed = parseId(id)
    return {
        space_id : parsed.spaceId,
        id : parsed.folderId
    }
}

function init() {
    var target

    globs.wide = true

    Nav.onStateChange = onStateChange

    globs.isDev = false
    globs.isTryMe = false
    globs.clipboard = new browser.Clipboard()
    browser.initControls(
        globs.wide,
        globs.isTryMe
    )
    bindEditor()
    resetSearch()
    browser.widgets.foreach(putAsidePath)
    browser.widgets.foreach(putAsideSearches)
    target = {
        onData : browser.onInitCompleted,
        onError : panic
    }
    loadSplitterValues()
    sv_folder(gSpaceId, "1", undefined)
}

function initNormal(parts, target) {
    var folderId, spaceId
    var _sw500000_ = 0;
    if (parts[0] == IDE) {
        _sw500000_ = parts[1];
        if (_sw500000_ === "doc") {
            if (parts.length == 4) {
                folderId = parts[3]
                spaceId = parts[2]
                sv_folder(spaceId, folderId, target)
            } else {
                panic("ERR_BAD_PATH")
            }
        } else {
            if (_sw500000_ === "trash") {
                sv_trash(target)
            } else {
                if (_sw500000_ === "spaces") {
                    sv_spaces(target)
                } else {
                    if (_sw500000_ === "recent") {
                        sv_recent(target)
                    } else {
                        if (_sw500000_ === "dashboard") {
                            sv_dashboard(target)
                        } else {
                            panic("ERR_BAD_PATH")
                        }
                    }
                }
            }
        }
    } else {
        panic("ERR_BAD_PATH")
    }
}

function initTryMe(target) {
    if (gUserId) {
        browser.goToUrl(Root)
    } else {
        startMachine(
            new TryMeLoader(),
            null,
            target
        )
    }
}

function isAnyCurrent(folders) {
    var currentId, item, tree
    if (globs.current) {
        currentId = globs.current.id
        if (currentId) {
            tree = getWidget("tree")
            var _ind3327 = 0;
            var _col3327 = folders;
            var _len3327 = _col3327.length;
            while (true) {
                if (_ind3327 < _len3327) {
                    
                } else {
                    return false
                }
                var folder = _col3327[_ind3327];
                if (currentId === folder) {
                    return true
                }
                if (tree.hasItem(folder)) {
                    item = tree.getItem(folder)
                    if (isUnderFolder(currentId, item)) {
                        return true
                    }
                }
                _ind3327++;
            }
        } else {
            return false
        }
    } else {
        return false
    }
}

function isDevUrl() {
    var url
    url = browser.getUrl()
    return url.indexOf("dev=true") != -1
}

function isDiagram() {
    if (globs.current.screen == "middle_diagram") {
        return true
    } else {
        return false
    }
}

function isDiagramOrFolder() {
    var _sw45860000_ = 0;
    _sw45860000_ = globs.current.screen;
    if (_sw45860000_ === "middle_folder") {
        return true
    } else {
        if (_sw45860000_ === "middle_diagram") {
            return true
        } else {
            if (_sw45860000_ === "middle_app") {
                return true
            } else {
                if (_sw45860000_ === "middle_spaces") {
                    return false
                } else {
                    return false
                }
            }
        }
    }
}

function isFolder() {
    if (globs.current.screen == "middle_folder") {
        return true
    } else {
        return false
    }
}

function isHuman(folder) {
    if ((folder.language) && (!(folder.language === "LANG_HUMAN"))) {
        return false
    } else {
        return true
    }
}

function isInPrevious(id) {
    var found
    found = globs.current.previous.indexOf(id)
    if (found == -1) {
        return false
    } else {
        return true
    }
}

function isReadonly() {
    return !!globs.current.isReadonly
}

function isReadonlyAccess(folder) {
    if (folder.access) {
        return folder.access == "read"
    } else {
        return true
    }
}

function isSpace(data) {
    if (data.id == "1") {
        return true
    } else {
        return false
    }
}

function isTryMeUrl() {
    var path
    path = browser.getPath()
    return path == "/try-me"
}

function isTypeDiagram(type) {
    if (((type === "drakon") || (type === "free")) || (type === "mind")) {
        return true
    } else {
        return false
    }
}

function isUnderFolder(currentId, item) {
    if (currentId == item.id) {
        return true
    } else {
        var _ind3349 = 0;
        var _col3349 = item.kids;
        var _len3349 = _col3349.length;
        while (true) {
            if (_ind3349 < _len3349) {
                
            } else {
                return false
            }
            var child = _col3349[_ind3349];
            if (isUnderFolder(currentId, child)) {
                return true
            }
            _ind3349++;
        }
    }
}

function killMachine(machine) {
    if (machine) {
        machine.state = null
    }
}

function killSearchMachine() {
    killMachine(globs.searchMachine)
    globs.searchMachine = null
}

function loadNextFont(self) {
    var font = self.fonts[self.fontId]
    self.fontId++
    browser.loadFontCore(
    	font,
    	self
    )
}

function loadSplitterValues() {
    var editor, widget
    editor = getEditor()
    if ((globs.isTryMe) || (!(globs.wide))) {
        closeRightPaneCore(true)
        closeLeftPaneCore(true)
    } else {
        widget = getWidget("splitter")
        widget.left = getLeftSplitterWidth()
        widget.right = getRightSplitterWidth()
        widget.leftVisible = getLeftSplitterVisible()
        widget.rightVisible = getRightSplitterVisible()
        globs.leftPaneStatus = new PaneStatus()
        globs.leftPaneStatus.showPane = openLeftPaneCore
        globs.leftPaneStatus.hidePane = closeLeftPaneCore
        globs.rightPaneStatus = new PaneStatus()
        globs.rightPaneStatus.showPane = openRightPaneCore
        globs.rightPaneStatus.hidePane = closeRightPaneCore
        if (widget.leftVisible) {
            globs.leftPaneStatus.state = "Visible"
            editor.hideLeftButton(
                globs.openLeftIndex
            )
        } else {
            globs.leftPaneStatus.state = "Hidden"
            editor.showLeftButton(
                globs.openLeftIndex
            )
        }
        if (widget.rightVisible) {
            globs.rightPaneStatus.state = "Visible"
            editor.hideRightButton(
                globs.openRightIndex
            )
        } else {
            globs.rightPaneStatus.state = "Hidden"
            editor.showRightButton(
                globs.openRightIndex
            )
        }
    }
}

function login() {
    
}

function logonFirst() {
    var url
    url = makeLogonUrl()
    browser.goToUrl(url)
}

function makeChoiceApp() {
    return {
        type : "app",
        text : "MES_NEW_APP"
    }
}

function makeChoiceDiagram() {
    return {
        type : "drakon",
        text : "MES_FUNCTION"
    }
}

function makeChoiceFolder() {
    return {
        type : "folder",
        text : "MES_FOLDER"
    }
}

function makeChoiceModule() {
    return {
        type : "module",
        text : "MES_NEW_MODULE"
    }
}

function makeDashboardUrl() {
    var url = "/" + IDE + "/dashboard"
    return url
}

function makeDiagramSearchDefs() {
    var defs = [
    	{
    		id: "items",
    		name: translate("MES_SHOW_DIAGRAM_CONTENT"),
    		items: []
    	},
    	{
    		id: "folders",
    		name: translate("MES_FOLDERS"),
    		items: []
    	},
    	{
    		id: "allItems",
    		name: translate("MES_SHOW_ALL_DIAGRAM_CONTENT"),
    		items: []
    	}
    ]
    return defs
}

function makeEmptyTarget() {
    return {
        onData : function(){},
        onError : function(){}
    }
}

function makeErrorMessage(data) {
    var message = Utils.makeErrorMessage(data)
    return translate(message)
}

function makeFolderUrl(spaceId, folderId) {
    var url
    url = "/" + IDE + "/doc/" +
      spaceId + "/" + folderId
    return url
}

function makeGo(url) {
    return function() {
    	browser.goToUrl(url)
    }
}

function makeId(spaceId, folderId) {
    return spaceId + " " + folderId
}

function makeIdFromChild(folder) {
    return makeId(
        folder.space_id,
        folder.id
    )
}

function makeImageCell(type) {
    var image
    image = getImage(type)
    return makeImageCellCore(image)
}

function makeImageCellCore(image) {
    return {
        src : image,
        width : 30,
        height : 30,
        paddingLeft : "4px",
        paddingRight : "4px"
    }
}

function makeItemSearchDefs() {
    var defs = [
    	{
    		id: "allItems",
    		name: translate("MES_SHOW_ALL_DIAGRAM_CONTENT"),
    		items: []
    	}
    ]
    return defs
}

function makeLogonUrl() {
    var url = "/logon?tgt=" + browser.getUrl()
    return url
}

function makeModule(input) {
    var id
    id = input.folder_id
    return {
        id : id,
        name : input.name
    }
}

function makeRecentItem(list, spaceId, folderId, name) {
    
}

function makeRecentObject(folder) {
    var id
    id = makeId(
        folder.space_id,
        folder.folder_id || folder.id
    )
    return {
        id : id,
        text : folder.name,
        type : folder.type,
        space_id : folder.space_id,
        whenOpened: folder.whenOpened,
        module : folder.module,
        module_name : folder.module_name
    }
}

function makeRecentTitle() {
    var title = translate("MES_RECENT") + " - " + getAppName()
    return title
}

function makeRecentUrl() {
    var url = "/" + IDE + "/recent"
    return url
}

function makeSeparator(list) {
    if ((list.length === 0) || (!(list[list.length - 1].type === "separator"))) {
        var item = {
        	type: "separator"
        }
        list.push(item)
    }
}

function makeSpaceName(name) {
    name = name.trim()
    return name.replace(/ /g, "_")
}

function makeSpacesTitle() {
    var title = translate("MES_SPACES") + " - " + getAppName()
    return title
}

function makeSpacesUrl(spaceId, folderId) {
    var url
    url =  "/" + IDE + "/spaces"
    return url
}

function makeSure1(spaceId) {
    var text = translate("MES_SURE_DELETE_SPACE") +
      " " + spaceId + "?"
    var titleLabel = {
    	type: "wlabel",
    	text: "MES_DELETE_SPACE",
    	textAlign: "center",
    	style: {
    		fontSize: "110%",
    		fontWeight: "bold"
    	}
    }
    var lab = {
    	type: "wlabel",
    	text: text,
    	raw: true,
    	style: {
    		fontSize: "100%",
    		textAlign: "left"
    	}
    }
    var confirm = {
    	signalId: "sendToCentralMachine",
    	type: "wbutton",
    	text: "MES_DELETE_SPACE",
    	style: {
    		color: "white",
    		background: DarkBackground,
    		padding: "12px",
    		textAlign: "center"
    	}
    }
    var cancel = {
    	signalId: "hideCentral",
    	type: "wbutton",
    	text: "MES_CANCEL",
    	style: {
    		color: "white",
    		background: DarkBackground,
    		padding: "12px",
    		textAlign: "center"
    	}
    }
    var root = {
    	type: "page",
    	style: {
    		background: "white"
    	},
    	padding: 10,
    	kids: [titleLabel, lab, confirm, cancel]
    }
    return root
}

function makeSure2(spaceId) {
    var titleLabel = {
    	type: "wlabel",
    	text: "MES_ATTENTION",
    	textAlign: "center",
    	style: {
    		fontSize: "110%",
    		fontWeight: "bold"
    	}
    }
    var lab = {
    	type: "wlabel",
    	text: "MES_SURE_DELETE_SPACE2",
    	style: {
    		fontSize: "100%",
    		textAlign: "left"
    	}
    }
    var confirm = {
    	signalId: "sendToCentralMachine",
    	type: "wbutton",
    	text: "MES_DELETE_SPACE",
    	style: {
    		color: "white",
    		background: "red",
    		padding: "12px",
    		textAlign: "center"
    	}
    }
    var cancel = {
    	signalId: "hideCentral",
    	type: "wbutton",
    	text: "MES_CANCEL",
    	style: {
    		color: "white",
    		background: DarkBackground,
    		padding: "12px",
    		textAlign: "center"
    	}
    }
    var root = {
    	type: "page",
    	style: {
    		background: "white"
    	},
    	padding: 10,
    	kids: [titleLabel, lab, confirm, cancel]
    }
    return root
}

function makeSureDelete() {
    var text = translate("MES_SURE_DELETE_OBJECTS")
    var titleLabel = {
    	type: "wlabel",
    	text: "MES_DELETE",
    	textAlign: "center",
    	style: {
    		fontSize: "110%",
    		fontWeight: "bold"
    	}
    }
    var lab = {
    	type: "wlabel",
    	text: text,
    	raw: true,
    	style: {
    		fontSize: "100%",
    		textAlign: "left"
    	}
    }
    var confirm = {
    	signalId: "sendToCentralMachine",
    	type: "wbutton",
    	text: "MES_DELETE",
    	style: {
    		color: "white",
    		background: "red",
    		padding: "12px",
    		textAlign: "center"
    	}
    }
    var cancel = {
    	signalId: "hideCentral",
    	type: "wbutton",
    	text: "MES_CANCEL",
    	style: {
    		color: "white",
    		background: DarkBackground,
    		padding: "12px",
    		textAlign: "center"
    	}
    }
    var root = {
    	type: "page",
    	style: {
    		background: "white"
    	},
    	padding: 10,
    	kids: [titleLabel, lab, confirm, cancel]
    }
    return root
}

function makeSureLoad(spaceId) {
    var titleLabel = {
    	type: "wlabel",
    	text: "MES_ATTENTION",
    	textAlign: "center",
    	style: {
    		fontSize: "110%",
    		fontWeight: "bold"
    	}
    }
    var lab = {
    	type: "wlabel",
    	text: "MES_SURE_LOAD_SPACE",
    	style: {
    		fontSize: "100%",
    		textAlign: "left"
    	}
    }
    var confirm = {
    	signalId: "sendToCentralMachine",
    	type: "wbutton",
    	text: "MES_LOAD_AND_REPLACE",
    	style: {
    		color: "white",
    		background: "red",
    		padding: "12px",
    		textAlign: "center"
    	}
    }
    var cancel = {
    	signalId: "hideCentral",
    	type: "wbutton",
    	text: "MES_CANCEL",
    	style: {
    		color: "white",
    		background: DarkBackground,
    		padding: "12px",
    		textAlign: "center"
    	}
    }
    var root = {
    	type: "page",
    	style: {
    		background: "white"
    	},
    	padding: 10,
    	kids: [titleLabel, lab, confirm, cancel]
    }
    return root
}

function makeTarget(onData, onError) {
    return {
        onData : onData,
        onError : onError
    }
}

function makeTextCell(text) {
    return {
        text : text
    }
}

function makeTextListItem(list, textId, action, id, image) {
    var item = {
    	text: translate(textId),
    	code: action,
    	id: id,
    	image: image
    }
    list.push(item)
}

function makeTitle(spaceId, folderId, name) {
    var title = name
    return title
}

function makeTopCodes() {
    return {
        "middle_folder" : "top_folder",
        "middle_app" : "top_app",
        "middle_diagram" : "top_diagram",
        "middle_recent" : "top_empty",
        "middle_trash" : "top_empty",
        "middle_dashboard" : "top_empty",
        "middle_spaces" : "top_spaces"
    }
}

function makeTopCodesNu() {
    return {
        "middle_folder" : "top_folder_nu",
        "middle_diagram" : "top_diagram_nu",
        "middle_spaces" : "top_spaces_nu",
        "middle_app" : "top_app_nu"
    }
}

function makeTopCodesRo() {
    return {
        "middle_folder" : "top_folder_ro",
        "middle_diagram" : "top_diagram_ro",
        "middle_recent" : "top_empty",
        "middle_trash" : "top_empty",
        "middle_spaces" : "top_spaces",
        "middle_app" : "top_app_ro"
    }
}

function makeTrashTitle() {
    var title = translate("MES_DELETED_ITEMS") + " - " + getAppName()
    return title
}

function makeTrashUrl() {
    var url = "/" + IDE + "/trash"
    return url
}

function markPreviousSpace(spaces) {
    var id, spacesWidget
    spacesWidget = getWidget("middle_spaces")
    var _ind4648 = 0;
    var _col4648 = spaces;
    var _len4648 = _col4648.length;
    while (true) {
        if (_ind4648 < _len4648) {
            
        } else {
            break;
        }
        var spaceId = _col4648[_ind4648];
        id = makeId(spaceId, "1")
        if (isInPrevious(id)) {
            spacesWidget.mark(id)
            break;
        }
        _ind4648++;
    }
}

function onActionsClick(evt, type, widget, id, cellId) {
    var folders, items, status
    folders = getWidget("folder_grid")
    status = folders.getChecked()
    items = getActionList(
        status.checked
    )
    if (items.length) {
        browser.showPopupList(
            widget.id,
            items
        )
    }
}

function onBuilderError(self, msg) {
    var message
    if (msg.error) {
        message = msg.error
    } else {
        message = "An error has occurred"
    }
    browser.showBuild({
    	state: "error",
    	module: folderName,
    	errors: [{message: message}]
    })
    self.target.onError(msg)
}

function onCheckAll(evt, type, widget, id, cellId) {
    var checked, folders
    folders = getWidget("folder_grid")
    checked = folders.getChecked()
    if (widget.isChecked) {
        var _ind1151 = 0;
        var _col1151 = checked.unchecked;
        var _len1151 = _col1151.length;
        while (true) {
            if (_ind1151 < _len1151) {
                
            } else {
                break;
            }
            var id = _col1151[_ind1151];
            folders.check(id)
            _ind1151++;
        }
    } else {
        var _ind1154 = 0;
        var _col1154 = checked.checked;
        var _len1154 = _col1154.length;
        while (true) {
            if (_ind1154 < _len1154) {
                
            } else {
                break;
            }
            var id = _col1154[_ind1154];
            folders.uncheck(id)
            _ind1154++;
        }
    }
    updateActionList()
}

function onDelete(id) {
    deleteFromHistory(id)
    deleteFromTree(id)
    deleteFromGrid(id)
    removeFromCache(id)
}

function onCut(id) {
    gCutFolders[id] = true
    var tree = getWidget("tree")
    tree.setColor(id, cutColor)
    var grid = getWidget("folder_grid")
    grid.setItemColor(id, 1, cutColor)
}

function setNameColor(id, color) {
    var tree = getWidget("tree")
    tree.setColor(id, color)
    var grid = getWidget("folder_grid")
    grid.setItemColor(id, 1, color)
}

function resetCutFolders() {
    for (var id in gCutFolders) {
        setNameColor(id, "")
    }
    gCutFolders = {}
}



function onDiagramError(data) {
    var saver = globs.saver
    if (saver) {
        if (data.error == "ERR_MODIFIED") {
            browser.showNotification(
                translate("ERR_MODIFIED")
            )
            saver.notSaved()
        } else {
            saver.onError(data)
        }
    }
}

function onDiagramSaved(data) {
    var saver = globs.saver
    if (data && data.error) {
        onDiagramError(data)
        return
    }

    if (saver.nameChanged) {
        setDecoratedTitle(saver.nameChanged)
        renameEverywhere(saver.idForRename, saver.nameChanged)
    }    
    if (saver) {
        saver.saved()
    }
}

function onEvent(evt, type, widget, rowId, cellId) {
    var ctr, handler, start
    handler = getHandler(
        globs.handlers,
        widget,
        type
    )
    if (handler) {
        handler(
            evt,
            type,
            widget,
            rowId,
            cellId
        )
    } else {
        ctr = getHandler(
            globs.machineHandlers,
            widget,
            type
        )
        if (ctr) {
            start = {
                evt : evt,
                type : type,
                widget : widget,
                rowId : rowId,
                cellId : cellId
            }
            startAsync(
                new ctr(),
                start,
                null
            )
        }
    }
}

function onFolderClick(evt, type, widget, id, cellId) {
    if (cellId == 0) {
        if (widget.isChecked(id)) {
            widget.uncheck(id)
        } else {
            widget.check(id)
        }
        updateActionList()
    } else {
        goToFolder(id)
    }
}

function onFolderGridContext(evt, widget, id) {
    var folder, list, parent, toCopy
    HtmlUtils.stopPropagation(evt)
    parent = globs.current.id
    list = []
    widget.mark(id)
    toCopy = getItemsToCopy(id)
    folder = getFromCache(id)
    if (shouldFindReferences(folder.type)) {
        makeTextListItem(
            list,
            "MES_FIND_REFERENCES",
            function() {findReferences(folder.name)}
        )
        makeSeparator(
            list
        )
    }
    makeTextListItem(
        list,
        "MES_COPY",
        function() {copyFoldersCore(toCopy)}
    )
    if (isReadonly()) {
        
    } else {
        makeTextListItem(
            list,
            "MES_CUT",
            function() {cutFoldersCore(parent, toCopy)}
        )
        if (canPasteFolder()) {
            makeTextListItem(
                list,
                "MES_PASTE",
                pasteFolders
            )
        }
        makeSeparator(
            list
        )
        makeTextListItem(
            list,
            "MES_DELETE",
            function() {deleteFoldersCore(parent, toCopy)},
            null,
            "delete.png"
        )
        makeSeparator(
            list
        )
        makeTextListItem(
            list,
            "MES_RENAME",
            function() {rename(id)}
        )
        makeTextListItem(
        	list,
        	"MES_DESCRIPTION",
        	function() {changeDescription(id)}
        )
        makeSeparator(
            list
        )
        if (folder.type == "module") {
            addGetUrl(
                list,
                folder
            )
            addBuild(
                list,
                folder
            )
            makeTextListItem(
            	list,
            	"MES_PROPERTIES",
            	function() {changeFolderProperties(id)}
            )
            makeSeparator(
                list
            )
        } else {
            if (folder.type == "drakon") {
                makeTextListItem(
                    list,
                    "MES_PROPERTIES",
                    function() {changeDiagramProperties(id)}
                )
                makeSeparator(
                    list
                )
            }
        }
        makeTextListItem(
            list,
            "MES_NEW_OBJECT",
            create,
            null,
            "to-primitive-s2.png"
        )
    }
    showContextMenu(
        evt,
        list
    )
    return false
}

function onFolderGridContextBack(evt, widget) {
    var list
    list = []
    if (isReadonly()) {
        
    } else {
        if (canPasteFolder()) {
            makeTextListItem(
                list,
                "MES_PASTE",
                pasteFolders
            )
            makeSeparator(
                list
            )
        }
        makeTextListItem(
            list,
            "MES_NEW_OBJECT",
            create,
            null,
            "to-primitive-s2.png"
        )
    }
    showContextMenu(
        evt,
        list
    )
    return false
}

function onFolderSearch(evt, type, widget, id, cellId) {
    var contains, filtered, folders, value
    value = widget.getValue().trim()
    folders = globs.current.folders
    if (value) {
        value = value.toLowerCase()
        contains = function(row) {
            return rowContainsText(row, 1, value)
        }
        filtered = folders.filter(contains)
        setItemsInFolderGrid(filtered)
    } else {
        setItemsInFolderGrid(folders)
    }
    updateActionList()
}

function onFoldersContext(evt, type, widget, id, cellId) {
    if (id) {
        onFolderGridContext(
            evt,
            widget,
            id
        )
    } else {
        onFolderGridContextBack(
            evt,
            widget
        )
    }
}

function onPasteError(data) {
    browser.hideWorking()
    if (data.error == "ERR_DIAGRAM_LIMIT") {
        browser.suggest(
            data.error,
            "team"
        )
    } else {
        panic(data)
    }
}

function onProjectClick(evt, type, widget, id, cellId) {
    var spacesWidget
    spacesWidget = getWidget("middle_spaces")
    if (cellId == 2) {
        spacesWidget.mark(id)
        showProjectMenu(
            evt.clientX,
            evt.clientY,
            id
        )
    } else {
        goToFolder(id)
    }
}

function onProjectContext(evt, type, widget, id, cellId) {
    var folder, isAdmin, isReadonly, list, spaceId, spacesWidget
    spacesWidget = getWidget("middle_spaces")
    if (id) {
        spacesWidget.mark(id)
        list = []
        makeTextListItem(
            list,
            "MES_DESCRIPTION",
            function() {changeDescription(id)}
        )
        folder = getFromCache(id)
        isReadonly = isReadonlyAccess(folder)
        isAdmin = (folder.access == "admin")
        if ((FEATURE_SAVE_PROJECT) && (!(isReadonly))) {
            makeSeparator(
                list
            )
            makeTextListItem(
                list,
                "MES_LOAD_FROM_FILE",
                function() {showLoadFromFile(spaceId)}
            )
            makeTextListItem(
                list,
                "MES_SAVE_TO_FILE",
                function() {showSaveToFile(spaceId)}
            )
        }
        if (isAdmin) {
            spaceId = parseId(id).spaceId
            makeSeparator(list)
            makeTextListItem(
                list,
                "MES_ACCESS",
                function() {showAccessScreen(spaceId, null)}
            )
        }
        showContextMenu(
            evt,
            list
        )
    }
}

function onRecentClick(evt, type, widget, id, cellId) {
    goToFolder(id)
}

function onSearchItem(type, target) {
    if (type === "folder") {
        goToFolder(
            target,
            null
        )
    } else {
        if (type === "item") {
            goToItem(
                target.id,
                target.itemId
            )
        }
    }
}

function onSplitterResize() {
    updateFeedbackPos()
    saveSplitterValues()
}

function onStateChange(data, onCompleted) {
    var _sw23300000_ = 0;
    _sw23300000_ = data.type;
    if (_sw23300000_ === "folder") {
        gSkipPushState = true
        goToFolder(data.id, onCompleted)
    } else {
        if (_sw23300000_ === "projects") {
            goToProjects(onCompleted)
        } else {
            if (_sw23300000_ === "trash") {
                goToTrash(onCompleted)
            } else {
                if (_sw23300000_ === "recent") {
                    goToRecent(onCompleted)
                } else {
                    if (_sw23300000_ === "dashboard") {
                        
                    } else {
                        throw "Unexpected switch value: " + _sw23300000_;
                    }
                    goToDashboard(onCompleted)
                }
            }
        }
    }
}

function onTag(data) {
    var saver = globs.saver
    if (saver) {
        saver.onTag(data)
    }
}

function onTagError(data) {
    var saver = globs.saver
    if (saver) {
        saver.onError(data)
    }
}

function onTrashClick(evt, type, widget, id, cellId) {
    if (cellId == 2) {
        startAsync(
            new Restorer(),
            id,
            null
        )
    }
}

function onTreeContext(evt, type, widget, id) {
    if (id) {
        onTreeContextFolder(
            evt,
            widget,
            id
        )
    } else {
        if (globs.user.userId) {
            onTreeContextBack(
                evt,
                widget
            )
        }
    }
}

function onTreeContextBack(evt, tree) {

    return false
}

function onTreeContextFolder(evt, tree, id) {
    var folder, into, isAdmin, isReadonly, isSpace, list
    CallTrace.add(
        "onTreeContextFolder",
        [id]
    )
    tree.mark(id)
    list = []
    if (id == "trash") {
        makeTextListItem(
            list,
            "MES_CLEAR_TRASH",
            clearRubbish
        )
    } else {
        if (id == "dashboard") {
            
        } else {
            folder = getFromCache(id)
            if (canContainChildren(folder)) {
                into = id
            } else {
                into = folder.parent
            }
            isSpace = (folder.folderId == "1")
            isReadonly = isReadonlyAccess(folder)
            isAdmin = (folder.access == "admin")
            if (isReadonly) {
                
            } else {
                addNewItems(id, list)
            }
            if (isSpace) {
                
            } else {
                if (shouldFindReferences(folder.type)) {
                    makeTextListItem(
                        list,
                        "MES_FIND_REFERENCES",
                        function() {findReferences(folder.name)}
                    )
                    makeSeparator(
                        list
                    )
                }
                makeTextListItem(
                    list,
                    "MES_COPY",
                    function() {copyFoldersCore([id])}
                )
                if (isReadonly) {
                    
                } else {
                    makeTextListItem(
                        list,
                        "MES_CUT",
                        function() {cutFoldersCore(folder.parent, [id])}
                    )
                }
            }
            if (isReadonly) {
                
            } else {
                if (canPasteInto(into)) {
                    makeTextListItem(
                        list,
                        "MES_PASTE",
                        function(){pasteFoldersCore(into)}
                    )
                }
                if (isSpace) {

                } else {
                    makeSeparator(
                        list
                    )
                    makeTextListItem(
                        list,
                        "MES_DELETE",
                        function() {deleteFoldersCore(folder.parent, [id])},
                        null,
                        "delete.png"
                    )
                    makeSeparator(
                        list
                    )
                    makeTextListItem(
                        list,
                        "MES_RENAME",
                        function() {rename(id)}
                    )
                }
            }

            if (folder.type == "module") {
                makeSeparator(
                    list
                )
                addGetUrl(
                    list,
                    folder
                )
                addBuild(
                    list,
                    folder
                )
                makeSeparator(
                    list
                )
                makeTextListItem(
                	list,
                	"MES_PROPERTIES",
                	function() {changeFolderProperties(id)}
                )
            } else {
                if (folder.type == "drakon") {
                    makeSeparator(
                        list
                    )
                    makeTextListItem(
                        list,
                        "MES_PROPERTIES",
                        function() {changeDiagramProperties(id)}
                    )
                }
            }
        }
    }
    showContextMenu(
        evt,
        list
    )
    return false
}

function openLeftPane() {
    globs.leftPaneStatus.show()
}

function openLeftPaneCore() {
    var splitter
    getEditor().hideLeftButton(
        globs.openLeftIndex
    )
    splitter = getWidget("splitter")
    splitter.leftVisible = true
    splitter.left = getLeftSplitterWidth()
    updateGui()
    saveSplitterValues()
}

function openRightPane() {
    globs.rightPaneStatus.show()
}

function openRightPaneCore() {
    var splitter
    getEditor().hideRightButton(
        globs.openRightIndex
    )
    splitter = getWidget("splitter")
    splitter.rightVisible = true
    splitter.right = getRightSplitterWidth()
    updateGui()
    saveSplitterValues()
}

function panic(data) {
    browser.panic(data)
}

function parseId(id) {
    var parts
    if (id) {
        parts = id.split(" ")
        return {
            spaceId : parts[0],
            folderId : parts[1]
        }
    } else {
        throw new Error("parseId: id is null")
    }
}

function parsePath() {
    var notEmpty, parts, path
    path = browser.getPath()
    parts = path.split("/")
    notEmpty = function(item) {
        return !!item
    }
    return parts.filter(notEmpty)
}

function parseSplitterValue(cookie) {
    var value
    value = parseInt(cookie)
    if (isNaN(value)) {
        value = 300
    }
    value = Math.min(value, window.innerWidth * 0.45)
    value = Math.floor(value)
    value = Math.max(value, MinSplitter)
    return value
}

function parseSplitterVisible(cookie) {
    if (cookie) {
        return cookie == "true"
    } else {
        return true
    }
}

function pasteFolders() {
    pasteFoldersCore(null)
}

function pasteFoldersCore(parentId) {
    var ctype, data, folders, onDone, operation, target
    resetCutFolders()
    parentId = getCurrentParent(parentId)
    if (parentId) {
        ctype = globs.clipboard.getClipboardType()
        if (Utils.startsWith(ctype, "copy-")) {
            CallTrace.add("copy-paste folders", [])
            operation = "copy"
        } else {
            CallTrace.add("cut-paste folders", [])
            operation = "move"
        }
        browser.showWorking()
        onDone = function() {
        	browser.hideWorking()
        	globs.clipboard.clear()
        }
        target = {
            onData : onDone,
            onError : onPasteError
        }
        folders = globs.clipboard.getClipboard()
        data = {
            folders : folders,
            operation : operation,
            parentId : parentId
        }
        if (operation === "move") {
            folders.forEach(onDelete)
        }
        
        startMachine(
            new Paster(),
            data,
            target
        )
    }
}

function pathCompleted(self) {
    return self.current >= self.path.length
}

function pushMenuItem(items, text, url) {
    items.push({
    	text: text,
    	link: url
    })
}

function pushNavFolder(id, name) {
    var data, ids, title, url
    data = {
        type : "folder",
        id : id
    }
    ids = parseId(id)
    url = makeFolderUrl(
        ids.spaceId,
        ids.folderId
    )
    title = makeTitle(
        ids.spaceId,
        ids.folderId,
        name
    )
    pushState(
        data,
        title,
        url
    )
}

function pushState(onState, title, url) {
    Nav.pushState(
    	onState,
    	title,
    	window.location.origin + url
    )
}


function pushTag(saver, tag) {
    saver.oldTag = saver.newTag
    saver.newTag = tag
}

function pushTempIfMobile() {
    if (globs.wide) {
        
    } else {
        pushTempState()
    }
}

function pushTempState() {
    if (globs.stateType() == "tmp") {
        
    } else {
        lt_go()
        var state = {
        	type: "tmp"
        }
        pushState(state, "", "", false)
    }
}

function pushTryMe() {
    var state = {
    	type: "tryMe"
    }
    pushState(state, "", "")
}

function putAsidePath(widget) {
    if (widget.type == "path") {
        widget.signalId = "path"
        globs.pathWidgets.push(widget.id)
    }
}

function putAsideSearches(widget) {
    if (widget.signalId == "globalSearch") {
        globs.globalSearches.push(widget.id)
    }
}

function putErrorOnNode(id) {
    var tree
    tree = getWidget("tree")
    tree.setIcon(
        id,
        "delete.png"
    )
    browser.hideWorking()
}

function quickSearch() {
    var editor
    editor = getEditor()
    editor.quickSearch()
}

function redo() {
    if ((isDiagram()) && (!(isReadonly()))) {
        getEditor().redo()
    }
}

function reloadDiagram() {
    startAsync(
        createFolderShower(false),
        globs.current.id,
        null
    )
}

function removeAccess(access, role, user) {
    var users
    users = access.roles[role]
    delete users[user]
}

function removeAt(array, index) {
    array.splice(index, 1)
}

function removeFromCache(id) {
    delete globs.folders[id]
}

function rename(id) {
    startMachine(
        new Renamer(),
        id,
        null
    )
}

function renameCheckedFolder() {
    var selected
    selected = getSelectedFolders()
    if (selected.length == 1) {
        rename(selected[0])
    }
}

function renameEverywhere(id, name) {
    getWidget("folder_grid").setItemText(id, 1, name)
    getWidget("tree").setText(id, name)
    renameInHistory(id, name)
    renameInPath(id, name)
    renameInCache(id, name)
    if (id == globs.current.id) {
        browser.setMobileHeader(name)
    }
}

function renameInCache(id, name) {
    var folder
    folder = globs.folders[id]
    if (folder) {
        folder.name = name
    }
}

function renameInHistory(id, name) {
    var recent, recentMiddle
    recent = getWidget("recent")
    recent.setItemText(id, name)
    recentMiddle = getWidget("middle_recent")
    recentMiddle.setItemText(id, 1, name)
}

function renameInPath(name, id) {
    var widget
    var _ind3637 = 0;
    var _col3637 = globs.pathWidgets;
    var _len3637 = _col3637.length;
    while (true) {
        if (_ind3637 < _len3637) {
            
        } else {
            break;
        }
        var widgetId = _col3637[_ind3637];
        widget = getWidget(widgetId)
        widget.renameStage(
            name,
            id
        )
        _ind3637++;
    }
}

function requestAccount(target) {
    var folder
    backend.getFolder(gSpaceId, "1").then(
    	folder => {
    		target.onData({
    			name: "user",
    			spaces_access: [folder]
    		})
    	}
    ).catch(target.onError)
}

function requestHistory(target) {
    var data
    backend.getHistory().then(
    	target.onData
    ).catch(target.onError)
}

function requestTheme(target) {
    backend.getSettings().then(target.onData).catch(target.onError)
}

function resetSearch() {
    killMachine(globs.searchMachine)
    killMachine(globs.searchThrottle)
    globs.searchMachine = null
    globs.searchThrottle = null
    globs.searchThrottle = new InputThrottle()
}

function rowContainsText(row, index, text) {
    var low, value
    value = row.cells[index].text
    low = value.toLowerCase()
    return low.indexOf(text) != -1
}

function rub_clearSpace(self, spaceId) {
    var url = "/api/trash/" + spaceId
    browser.sendDelete(url, self)
}

function rub_copyTrashItems(self, data) {
    var item
    if (isReadonlyAccess(data)) {
        
    } else {
        var _ind5077 = 0;
        var _col5077 = data.items;
        var _len5077 = _col5077.length;
        while (true) {
            if (_ind5077 < _len5077) {
                
            } else {
                break;
            }
            var titem = _col5077[_ind5077];
            item = {
                space_id : titem.space_id,
                id : titem.id,
                type : titem.type,
                name : titem.name
            }
            self.items.push(item)
            _ind5077++;
        }
    }
}

function rub_getUrl(self) {
    var url = "/api/trash/" +
      self.spaces[self.current]
    return url
}

function rub_sort(self) {
    var byName
    byName = function(left, right) {
        return left.name.localeCompare(right.name)
    }
    self.items.sort(byName)
}

function runManyOperation(parentId, folders, operation, machine) {
    var items, parsed, payload, target
    parsed = parseId(parentId)
    target = {
        space_id : parsed.spaceId,
        folder_id : parsed.folderId
    }
    items = folders.map(idToServerFolder)
    payload = {
        items : items,
        target : target,
        operation : operation
    }
    backend.changeMany(payload).then(machine.onData).catch(machine.onError)
}

function save(saver, item) {
    saver.queue.push(item)
    saveNext(saver)
}

function saveAccessData(access) {
    if (access.setPublicAccess) {
        var _ind4292 = 0;
        var _col4292 = globs.folders;
        var _keys4292 = Object.keys(_col4292); 
        var _len4292 = _keys4292.length;
        while (true) {
            if (_ind4292 < _len4292) {
                
            } else {
                break;
            }
            var id = _keys4292[_ind4292]; var folder = _col4292[id];
            if (folder.space_id == access.spaceId) {
                folder.is_public = access.isPublic
            }
            _ind4292++;
        }
    }
}

function saveApp(data) {
    console.log("saveApp", data)
}

function textToContent(change) {
    textContentInChangeList(change.added)
    textContentInChangeList(change.updated)
}

function textContentInChangeList(changes) {
    if (!changes) { return }
    for (var change of changes) {
        if ("text" in change) {
            change.content = change.text
            delete change.text
        }
    }
}

function saveChange(spaceId, folderId, change, target) {
    textToContent(change)
    backend.updateFolder(spaceId, folderId, change).then(target.onData).catch(target.onError)
}

function saveChanges(changes) {
    var saver
    saver = globs.saver
    if (saver) {
        saver.save(changes)
    }
}

function saveDiagram() {
    startMachine(
        new SignupMachineShort(),
        null,
        self
    )
}

function saveNext(saver) {
    var item
    item = saver.queue.shift()
    saveNow(saver, item)
}

function saveNow(saver, data) {
    var id, ids, target
    pushTag(saver, data.tag)
    id = globs.current.id
    saver.nameChanged = data.name
    saver.idForRename = id
    target = makeTarget(
        onDiagramSaved,
        onDiagramError
    )
    ids = parseId(id)
    saver.lastIo = getTime()
    saveChange(
        ids.spaceId,
        ids.folderId,
        data,
        target
    )
}

function saveSplitterValues() {
    var left, lv, right, rv, widget
    widget = getWidget("splitter")
    left = Math.max(widget.left, MinSplitter)
    right = Math.max(widget.right, MinSplitter)
    lv = widget.leftVisible
    rv = widget.rightVisible
    HtmlUtils.setCookie("splitter-left", left.toString(), 30)
    HtmlUtils.setCookie("splitter-right", right.toString(), 30)
    HtmlUtils.setCookie("splitter-left-vis", lv.toString(), 30)
    HtmlUtils.setCookie("splitter-right-vis", rv.toString(), 30)
}

function saveTry(target) {
    var diagram
    diagram = getEditor().getDiagram()
    browser.sendPost(
    	"/api/save_try",
    	diagram,
    	target
    )
}

function saveUserPropsInMem(settings) {
    Utils.copyFields(
        settings,
        globs.user.props
    )
}

function saveUserSettings(settings) {
    saveUserPropsInMem(settings)
    backend.updateSettings(settings)
}

function scanItems(collection, needle, items, name, id, path) {
    var found, item, text, text2
    if (collection) {
        var _ind6663 = 0;
        var _col6663 = collection;
        var _keys6663 = Object.keys(_col6663); 
        var _len6663 = _keys6663.length;
        while (true) {
            if (_ind6663 < _len6663) {
                
            } else {
                break;
            }
            var itemId = _keys6663[_ind6663]; var node = _col6663[itemId];
            text = node.text
            text2 = node.text2
            found = Utils.findNormSubstring(
                text,
                needle
            )
            if (found) {
                item = {
                    name : name,
                    type : "item",
                    target : {id: id, itemId:itemId},
                    found : found,
                    path : path
                }
                items.push(item)
            } else {
                found = Utils.findNormSubstring(
                    text2,
                    needle
                )
                if (found) {
                    item = {
                        name : name,
                        type : "item",
                        target : {id: id, itemId:itemId},
                        found : found,
                        path : path
                    }
                    items.push(item)
                }
            }
            _ind6663++;
        }
    }
}

function scheduleBuildCheck(self) {
    scheduleNextMessage(
        self,
        "timeout",
        null,
        BuildCheck
    )
}

function scheduleNextMessage(machine, method, data, delay) {
    var delayed, src
    delayed = function() {
        machine[method](data)
    }
    src = "Schedule next method: " + 
     machine.type_name + "." +
     method
    browser.setTimeout(delayed, delay, src)
}

function scheduleNextState(machine, data) {
    scheduleNextStateAfter(
        machine,
        data,
        1
    )
}

function scheduleNextStateAfter(machine, data, delay) {
    var delayed, src
    delayed = function() {
        machine.onData(data)
    }
    src = "Schedule next state: " + machine.type_name
    browser.setTimeout(delayed, delay, src)
}

function schedulePoll() {
    // var interval, timer
    // cancelPolling()
    // interval = PollInterval + Math.random() * 0.5
    // timer = browser.setTimeout(
    //     timeToPoll,
    //     interval * 1000,
    //     "schedulePoll"
    // )
    // globs.pollTimer = timer
}

function selectTreeItem(id) {
    var tree
    tree = getWidget("tree")
    tree.select(id)
    tree.scrollIntoView(id)
}

function sendBuild(self) {
    var msg, options
    msg = {}
    self.builder = startMachine(
        new Builder(),
        msg,
        self
    )
    options = {
        state : "working",
        module : folderName
    }
    browser.showBuild(
        options
    )
}



function sendCreateDiagram(spaceId, parentFolderId, props, target) {
    var data = {
        parent : parentFolderId
    }
    Object.assign(data, props)
    backend.createFolder(spaceId, data).then(target.onData).catch(target.onError)
}

function sendCreateFolder(spaceId, parentFolderId, type, name, target, language) {
    var data = {
        parent : parentFolderId,
        type : type,
        name : name,
        language : language
    }
    backend.createFolder(spaceId, data).then(target.onData).catch(target.onError)
}

function sendDelete(folders, target) {
    var items = folders.map(
        idToServerFolder
    )
    var payload = {
        items : items,
        operation : "delete"
    }
    backend.changeMany(payload).then(target.onData).catch(target.onError)
}

function sendGetFolder(spaceId, folderId, target) {
    backend.getFolder(
    	spaceId,
    	folderId
    ).then(target.onData).catch(target.onError)
}

function sendGetFolderProps(spaceId, folderId, target) {
    var url
    url = "/api/folder_props/" + spaceId +
    	"/" + folderId
    browser.sendGet(
        url,
        target
    )
}

function sendGetSearch(target) {
    backend.pollSearch().then(target.onData).catch(target.onError)
}

function sendInput(self) {
    var msg = {
        widgetId : self.widgetId,
        input : self.input
    }
    self.target.onInput(
        msg
    )
}

function sendRename(self, spaceId, folderId, name) {
    var payload = {
        name : name
    }
    backend.updateFolder(spaceId, folderId, payload).then(self.onData).catch(self.onError)
}

function sendSaveDiagramProps(spaceId, folderId, payload, self) {  
    backend.updateFolder(
        spaceId,
        folderId,
        payload
    ).then(self.onData).catch(self.onError)
}

function sendSaveFolderProps(spaceId, folderId, data, target) {
    var url
    url = "/api/folder_props/" + spaceId +
    	"/" + folderId
    browser.sendPost(
        url,
        data,
        target
    )
}

function setAccount(data) {
    globs.user.name = data.name
    globs.user.spaces = {}
    var _ind362 = 0;
    var _col362 = data.spaces_access;
    var _len362 = _col362.length;
    while (true) {
        if (_ind362 < _len362) {
            
        } else {
            break;
        }
        var space = _col362[_ind362];
        globs.user.spaces[space.space_id] = space
        addSpaceToCache(space)
        _ind362++;
    }
}

function setActiveScreen(screen, access) {
    var top, topCode
    getWidget("middle").setActive(screen)
    globs.current.screen = screen
    if (globs.isTryMe) {
        topCode = "top_diagram_try"
    } else {
        if (globs.user.userId) {
            if (access === "read") {
                globs.current.isReadonly = true
                topCode = globs.topCodesRo[screen]
            } else {
                globs.current.isReadonly = false
                topCode = globs.topCodes[screen]
            }
        } else {
            globs.current.isReadonly = true
            topCode = globs.topCodesNu[screen]
        }
    }
    top = getWidget("top")
    top.setActive(topCode)
    updateGui()
}

function normalizeDiagram(diagram) {
    var items = []
    if (diagram.items) {
        for (var id in diagram.items) {
            var item = diagram.items[id]
            fixContent(item)
            item.id = id
            items.push(item)
        }
    }
    diagram.items = items
}

function fixContent(item) {
    if ("content" in item) {
        item.text = item.content
        delete item.content
    }
}

function setDiagram(self) {
    var onReadonly
    if (gUserId) {
        onReadonly = null
    } else {
        onReadonly = saveDiagram
    }
    getEditor().setReadonly(
        isReadonly(),
        onReadonly
    )
    normalizeDiagram(self.diagram)
    getEditor().setDiagram(
    	self.diagram,
    	true
    )
    if (self.home) {
        getEditor().restoreDiagramPosition()
    }
    showDemo()
}

function setHistory(recent) {
    globs.user.recent = recent.map(makeRecentObject)
    updateHistoryList()
}

function setImage(item) {
    item.image = getImage(item.type)
}

function setItemsInFolderGrid(rows) {
    var folders
    folders = getWidget("folder_grid")
    var buttons = []
    if (isReadonly()) {
        
    } else {
        if ((globs.current.type == "module") || (getFolderCategory(globs.current.id) == "module-folder")) {
            buttons.push({
            	main: true,
            	action: createDiagram,
            	text: "MES_CREATE_FUNCTION"
            })
        } else {
            buttons.push({
            	main: true,
            	action: createModule,
            	text: "MES_NEW_MODULE"
            })
            buttons.push({
            	action: createApp,
            	text: "MES_NEW_APP"
            })
        }
        buttons.push({
        	action: createFolder,
        	text: "MES_CREATE_FOLDER"
        })
    }
    folders.setItems(
        Utils.copyObjectDeep(rows),
        buttons
    )
    var _ind1166 = 0;
    var _col1166 = rows;
    var _len1166 = _col1166.length;
    while (true) {
        if (_ind1166 < _len1166) {
            
        } else {
            break;
        }
        var row = _col1166[_ind1166];
        if (isInPrevious(row.id)) {
            folders.mark(row.id)
            break;
        }
        _ind1166++;
    }
    getWidget("check_all").setChecked(false)
}

function setPath(path) {
    var i, id, parent, parentId, step
    path = path || []
    if (path.length > 1) {
        parent = path[path.length - 2]
        parentId = makeIdFromChild(parent)
        globs.current.parent = parentId
    } else {
        globs.current.parent = null
    }
    clearPath()
    i = 0;
    while (true) {
        if (i < path.length) {
            
        } else {
            break;
        }
        step = path[i]
        id = makeIdFromChild(step)
        addPathStage(
            getNormalName(step),
            id,
            i < path.length - 1
        )
        i++;
    }
}

function setSubtype(folder) {
    folder.subtype = getSubtype(folder)
}

function setTag(folder) {
    var doc
    doc = globs.current
    doc.oldTag = null
    doc.newTag = folder.tag
}

function setTreeChildren(data) {
    var childId, id, item, items, tree
    items = []
    tree = getWidget("tree")
    var _ind521 = 0;
    var _col521 = data.children;
    var _len521 = _col521.length;
    while (true) {
        if (_ind521 < _len521) {
            
        } else {
            break;
        }
        var child = _col521[_ind521];
        childId = makeIdFromChild(child)
        setSubtype(child)        
        var color = gCutFolders[childId] ? cutColor : undefined
        item = {
            id : childId,
            text : child.name,
            icon : getImage(child.subtype),
            rank : getRank(child.subtype),
            isFolder : canContainChildren(child),
            kids : [],
            color: color
        }
        items.push(item)
        deleteFromTree(childId)
        _ind521++;
    }
    id = makeIdFromChild(data)
    tree.setChildren(
        id,
        items
    )
}

function share() {
    startMachine(
        new Sharer(),
        null,
        null
    )
}

function shouldFindReferences(type) {
    if (((isTypeDiagram(type)) && (globs.wide)) && (!(globs.isTryMe))) {
        return true
    } else {
        return false
    }
}

function shouldShowDemo() {
    if (((((Config.SHOW_DEMO) && (!(isReadonly()))) && (isDiagram())) && (globs.wide)) && ((globs.current.type == "drakon") || (globs.current.type == "mind"))) {
        return true
    } else {
        return false
    }
}

function showAccessScreen(spaceId, target) {
    if (target) {
        
    } else {
        target = makeTarget(
            hideCentral,
            panic
        )
    }
    startMachine(
        new AccessShower(),
        spaceId,
        target
    )
}

function showApp(data) {
    var app
    app = getWidget("middle_app")
    app.setData(data)
}

function showBuild() {
    globs.build.showBuild()
}

function showContextMenu(evt, list) {
    var menu
    if (list.length == 0) {
        
    } else {
        menu = {
            rows : list
        }
        browser.showContextMenu(
            evt.clientX,
            evt.clientY,
            menu,
            null
        )
    }
}

function showCreateDialog(type, target, language) {
    var softCheck, title, validate
    softCheck = function(name) {
        return validateModuleName(name, language)
    }
    if (type === "folder") {
        validate = validateFolderName
        title = "MES_CREATE_FOLDER"
    } else {
        if (type === "module") {
            validate = softCheck
            title = "MES_NEW_MODULE"
        } else {
            if (type === "class") {
                validate = validateModuleName
                title = "MES_NEW_OBJECT"
            } else {
                if (type === "app") {
                    validate = validateModuleName
                    title = "MES_NEW_APP"
                } else {
                    validate = softCheck
                    title = "MES_CREATE_FUNCTION"
                }
            }
        }
    }
    title = translate(title)
    var onSave = function(text) {
    	target.name = text.trim()
    	target.onData(undefined)
    }
    browser.showInputBox(
        true,
        title,
        "",
        onSave,
        validate,
        true
    )
}

function showDashboard() {
    var dashboard, recent, recent2, spaces
    recent = getRecent()
    spaces = getSpaces()
    var addIcon = function(item) {
    	var copy = Utils.copyObject(item)
    	copy.icon = getImage(item.type)
    	return copy
    }
    recent2 = recent.map(addIcon)
    dashboard = getWidget("middle_dashboard")
    dashboard.setDashboardRecent(recent2)
    dashboard.setDashboardProjects(spaces)
    clearPath()
    addPathStage(
        translate("MES_DASHBOARD"),
        "<root>",
        false
    )
    browser.setTitle(getAppName())
    selectTreeItem("dashboard")
    setActiveScreen(
        "middle_dashboard",
        null
    )
    pushNavDashboard()
}

function showDemo() {
    if (browser.isDemoDiscarded()) {
        
    } else {
        showDemoCore()
    }
}

function showDemoCore() {
    var type
    if (shouldShowDemo()) {
        type = globs.current.type
        if ((type === "drakon") || (type === "mind")) {
            browser.showDemo(type)
        }
    }
}

function setDecoratedTitle(name) {
    if (name) {
        browser.setTitle(name + " | " + getAppName())
    } else {
        browser.setTitle(getAppName())
    }
}

function showFolderCommon(id, data) {
    var name, path
    globs.current.id = id
    globs.current.type = data.type
    name = getNormalName(data)
    browser.setMobileHeader(name)
    setDecoratedTitle(name)
    setPath(data.path)
    path = convertPathToIds(data.path)
    addToPrevious(path)
    if (gSkipPushState) {
        gSkipPushState = false
    } else {
        pushNavFolder(
            id,
            data.name
        )
    }
    updateUpButton(data)
}

function updateUpButton(data) {
    var ups = findWidgetsBySignalId("up")
    if (data.parent) {
        ups.forEach(up => up.ownDiv.style.visibility = "visible")
    } else {
        ups.forEach(up => up.ownDiv.style.visibility = "hidden")
    }
}

function showFolderInGrid(data) {
    var id, imageCell, row, rows, textCell
    data.children.forEach(setSubtype)
    data.children.sort(folderComparer)
    rows = []
    var _ind942 = 0;
    var _col942 = data.children;
    var _len942 = _col942.length;
    while (true) {
        if (_ind942 < _len942) {
            
        } else {
            break;
        }
        var child = _col942[_ind942];
        setSubtype(child)
        imageCell = makeImageCell(child.subtype)
        textCell = makeTextCell(child.name)        
        id = makeIdFromChild(child)
        if (id in gCutFolders) {
            textCell.color = cutColor
        }
        row = {
            id : id,
            cells : [imageCell, textCell]
        }
        rows.push(row)
        _ind942++;
    }
    globs.current.folders = rows
    setItemsInFolderGrid(rows)
    getWidget("check_all").setChecked(false)
    if (globs.wide) {
        
    } else {
        getWidget("folderSearch").clear()
    }
    updateActionList()
}


function showLoadProjectFromFileDialog() {
    var target = {
        onData: hideCentral,
        onError: browser.showNotification
    }    
    startMachine(
        new ProjectLoader(),
        undefined,
        target
    )
}

function showLoadFromFile(spaceId, target) {
    if (target) {
        
    } else {
        target = makeTarget(
            hideCentral,
            panic
        )
    }
    startMachine(
        new ProjectLoader(),
        spaceId,
        target
    )
}

async function showMainMenu() {
    var items
    items = await buildMainMenu()
    browser.showMainMenu(items)
}

function showProjectMenu(x, y, id) {
    var folder, isAdmin, isReadonly, list, spaceId
    folder = getFromCache(id)
    spaceId = parseId(id).spaceId
    list = []
    makeTextListItem(
        list,
        "MES_DESCRIPTION",
        function() {changeDescription(id)}
    )
    isReadonly = isReadonlyAccess(folder)
    isAdmin = (folder.access == "admin")
    if ((FEATURE_SAVE_PROJECT) && (!(isReadonly))) {
        makeSeparator(
            list
        )
        makeTextListItem(
            list,
            "MES_LOAD_FROM_FILE",
            function() {showLoadFromFile(spaceId)}
        )
        makeTextListItem(
            list,
            "MES_SAVE_TO_FILE",
            function() {showSaveToFile(spaceId)}
        )
    }
    if (isAdmin) {
        makeSeparator(list)
        makeTextListItem(
            list,
            "MES_ACCESS",
            function() {showAccessScreen(spaceId, null)}
        )
        makeTextListItem(
            list,
            "MES_DELETE_SPACE",
            function() {deleteProject(spaceId)}
        )
    }
    browser.showPopupListAt(
        x,
        y,
        list
    )
}

function showRecent() {
    var grid, leftIcon, row, rows, spaceId, textCell
    rows = []
    var _ind5310 = 0;
    var _col5310 = getRecent();
    var _len5310 = _col5310.length;
    while (true) {
        if (_ind5310 < _len5310) {
            
        } else {
            break;
        }
        var item = _col5310[_ind5310];
        spaceId = parseId(item.id).spaceId
        leftIcon = makeImageCell(item.type)
        textCell = makeTextCell(
            spaceId + ": " + item.text
        )
        row = {
            id : item.id,
            cells : [leftIcon, textCell]
        }
        rows.push(row)
        _ind5310++;
    }
    clearPath()
    addPathStage(
        translate("MES_RECENT"),
        "<root>",
        false
    )
    grid = getWidget("middle_recent")
    grid.setItems(rows)
    setActiveScreen(
        "middle_recent",
        null
    )
    pushNavRecent()
}

function showRenameDialog(folder, onSave, language) {
    var softCheck, title, validate
    var _sw72530000_ = 0;
    softCheck = function(name) {
        return validateModuleName(name, language)
    }
    _sw72530000_ = folder.type;
    if (_sw72530000_ === "folder") {
        validate = validateFolderName
        title = "MES_RENAME_FOLDER"
    } else {
        if (_sw72530000_ === "module") {
            validate = softCheck
            title = "MES_RENAME_OBJECT"
        } else {
            if (_sw72530000_ === "class") {
                validate = validateModuleName
                title = "MES_RENAME_OBJECT"
            } else {
                validate = softCheck
                title = "MES_RENAME_DIAGRAM"
            }
        }
    }
    title = translate(title)
    browser.showInputBox(
        true,
        title,
        folder.name,
        onSave,
        validate,
        true
    )
}

function showSaveToFile(spaceId, target) {
    if (target) {
        
    } else {
        target = makeTarget(
            hideCentral,
            panic
        )
    }
    startMachine(
        new ProjectSaver(),
        spaceId,
        target
    )
}

function showShareScreen(target) {
    var admin, folder, ids, isPublic
    ids = parseId(globs.current.id)
    folder = getFromCache(globs.current.id)
    if (folder) {
        isPublic = (folder.is_public == true)
        admin = (folder.access == "admin")
        browser.showShareScreen(
            ids.spaceId,
            ids.folderId,
            folder.type,
            isPublic,
            admin,
            target
        )
    }
}

function showSpacesInFolder() {
    var id, leftIcon, rightIcon, row, rows, spaces, spacesWidget, textCell
    spacesWidget = getWidget("middle_spaces")
    spaces = getSpaces()
    rows = []
    var _ind1584 = 0;
    var _col1584 = spaces;
    var _len1584 = _col1584.length;
    while (true) {
        if (_ind1584 < _len1584) {
            
        } else {
            break;
        }
        var spaceId = _col1584[_ind1584];
        id = makeId(spaceId, "1")
        leftIcon = makeImageCellCore("workspace-s2.png")
        rightIcon = makeImageCellCore("settings.png")
        textCell = makeTextCell(spaceId)
        row = {
            id : id,
            cells : [leftIcon, textCell, rightIcon]
        }
        rows.push(row)
        _ind1584++;
    }
    clearPath()
    addPathStage(
        translate("MES_SPACES"),
        "<root>",
        false
    )
    spacesWidget.setItems(rows)
    markPreviousSpace(spaces)
    setActiveScreen(
        "middle_spaces",
        null
    )
    pushNavSpaces()
}

function showSpacesInTree() {
    var items = []
    for (var spaceId in globs.user.spaces) {
        var space = globs.user.spaces[spaceId];
        var item = {
            id : makeId(spaceId, "1"),
            text : space.name,
            icon : "workspace-s2.png",
            rank : 10,
            isFolder : true,
            kids : []
        }
        items.push(item)
    }
    var tree = getWidget("tree")
    tree.setChildren(
        undefined,
        items
    )
    for (var spaceId in globs.user.spaces) {
        var space = globs.user.spaces[spaceId];
        var id = makeId(spaceId, "1")
        setTreeChildren(space)
        tree.expand(id)
    }    
}

function showTrash(items) {
    var button, grid, id, leftIcon, row, rows, textCell
    grid = getWidget("trash_grid")
    rows = []
    var _ind4995 = 0;
    var _col4995 = items;
    var _len4995 = _col4995.length;
    while (true) {
        if (_ind4995 < _len4995) {
            
        } else {
            break;
        }
        var item = _col4995[_ind4995];
        id = makeId(
            item.space_id,
            item.id
        )
        leftIcon = makeImageCell(item.type)
        textCell = makeTextCell(
            item.space_id + ": " + item.name
        )
        button = makeTextCell(
            translate("MES_RESTORE")
        )
        row = {
            id : id,
            cells : [leftIcon, textCell, button]
        }
        rows.push(row)
        _ind4995++;
    }
    clearPath()
    addPathStage(
        translate("MES_TRASH"),
        "<root>",
        false
    )
    grid.setItems(rows)
    selectTreeItem("trash")
    setActiveScreen(
        "middle_trash",
        null
    )
    pushNavTrash()
}

function signup() {
    
}

function spacesSearchItems(input) {
    var item, items, norm
    input = input.toLowerCase()
    items = []
    var _ind6330 = 0;
    var _col6330 = globs.user.spaces;
    var _keys6330 = Object.keys(_col6330); 
    var _len6330 = _keys6330.length;
    while (true) {
        if (_ind6330 < _len6330) {
            
        } else {
            break;
        }
        var spaceId = _keys6330[_ind6330]; var space = _col6330[spaceId];
        norm = spaceId.toLowerCase()
        if (Utils.stringContains(norm, input)) {
            item = {
                name : spaceId,
                image : "workspace-s2.png",
                type : "folder",
                target : makeId(spaceId, "1")
            }
            items.push(item)
        }
        _ind6330++;
    }
    return items
}

function startAsync(machine, start, onCompleted) {
    var onData, target
    onData = function() {
        endAsync(onCompleted)
    }
    target = makeTarget(
        onData,
        panic
    )
    browser.showWorking()
    startMachine(
        machine,
        start,
        target
    )
}

function startBuild(self) {
    if (isReadonly()) {
        browser.showNotification("Cannot build a read-only project")
    } else {
        var current = getCurrent()
        var folder = getFromCache(current.id)
        build_start(folder).then(self.onData).catch(self.onError)
    }
}

function startBuildAll(buildInfo) {
    var msg, options
    msg = {
        module : buildInfo.name,
        url : buildInfo.url
    }
    self.builder = startMachine(
        new AllBuilder(),
        msg,
        undefined
    )
    options = {
        state : "working",
        module : buildInfo.name
    }
    browser.showBuild(
        options
    )
}

function startMachine(machine, data, target) {
    if (target) {
        
    } else {
        target = makeTarget(
            function(){},
            function(){}
        )
    }
    machine.target = target
    scheduleNextState(
        machine,
        data
    )
    return machine
}

function startPoll(saver) {
    // var ids, target, url
    // ids = parseId(
    //     globs.current.id
    // )
    // saver.lastIo = getTime()
    // url = "/api/tag/" +
    //  ids.spaceId + "/" + ids.folderId +
    //  "/" + saver.lastIo
    // target = makeTarget(
    //     onTag,
    //     onTagError
    // )
    // browser.sendGet(url, target)
}

function startSearchFolders(needle, target) {
    var data, id
    id = parseId(globs.current.id)
    data = {
        spaces : [id.spaceId],
        type : "folders",
        needle : needle
    }
    backend.searchFolders(data).then(target.onData).catch(target.onError)
}

function startSearchItems(needle, target) {
    var data, id
    id = parseId(globs.current.id)
    data = {
        spaces : [id.spaceId],
        type : "items",
        needle : needle
    }
    backend.searchItems(data).then(target.onData).catch(target.onError)
}

function startSearchMachine(machine) {
    globs.searchMachine = machine
    machine.onData(null)
}

function startUserSearch(user, target) {
    var payload
    payload = {
        text : user
    }
    browser.sendPost(
    	"/api/find_users",
    	payload,
    	target
    )
}

function stopBuild(self) {
    build_stop()
}

function sv_dashboard(target) {
    if (gUserId) {
        startMachine(
            new DashboardShower(),
            null,
            target
        )
    } else {
        logonFirst()
    }
}

function sv_folder(spaceId, folderId, target) {
    var data, id
    id = makeId(
        spaceId,
        folderId
    )
    data = {
        id : id
    }
    startMachine(
        new RootFolderShower(),
        data,
        target
    )
}

function sv_recent(target) {
    if (gUserId) {
        startMachine(
            new RootRecentLoader(),
            null,
            target
        )
    } else {
        logonFirst()
    }
}

function sv_spaces(target) {
    if (gUserId) {
        startMachine(
            new RootSpacesShower(),
            null,
            target
        )
    } else {
        logonFirst()
    }
}

function sv_trash(target) {
    if (gUserId) {
        startMachine(
            new RootTrashShower(),
            null,
            target
        )
    } else {
        logonFirst()
    }
}

function timeToPoll() {
    var saver
    globs.pollTimer = null
    saver = globs.saver
    if (saver) {
        saver.timeout()
    }
}

function toAllItems(data, needle) {
    var found, id, item, items, path
    items = []
    needle = Utils.normalizeString(needle).text
    var _ind6646 = 0;
    var _col6646 = data.items;
    var _len6646 = _col6646.length;
    while (true) {
        if (_ind6646 < _len6646) {
            
        } else {
            break;
        }
        var it = _col6646[_ind6646];
        found = Utils.findNormSubstring(
            it.text,
            needle
        )
        if (found) {
            id = makeId(
                it.space_id,
                it.folder_id
            )
            path = it.path.slice(
                0,
                it.path.length - 1
            )
            item = {
                name : it.name,
                type : "item",
                target : {id: id, itemId:it.item_id},
                found : found,
                path : path.join("/")
            }
            items.push(item)
        }
        _ind6646++;
    }
    return items
}

function toFoundFolder(item) {
    var id, path
    path = item.path.slice(
        0,
        item.path.length - 1
    )
    id = makeId(
        item.space_id,
        item.folder_id
    )
    return {
        path : path.join("/"),
        name : item.name,
        type : "folder",
        target : id,
        image : getImage(item.type)
    }
}

function undo() {
    if ((isDiagram()) && (!(isReadonly()))) {
        getEditor().undo()
    }
}

function updateActionList() {
    var actions, checkAll, folders, items, status
    if (isFolder()) {
        folders = getWidget("folder_grid")
        status = folders.getChecked()
        items = getActionList(
            status.checked
        )
        actions = getWidget("actions")
        if (items.length > 0) {
            actions.enable(true)
            checkAll = getWidget("check_all")
            if ((status.unchecked.length == 0) && (!(status.checked.length == 0))) {
                checkAll.setChecked(true)
            } else {
                checkAll.setChecked(false)
            }
        } else {
            actions.enable(false)
        }
    }
}

function updateFeedbackPos() {
    var right
    right = findFeedbackRight()
    browser.placeFeedback(right)
}

function updateGui() {
    browser.onResize()
    if (globs.wide) {
        updateFeedbackPos()
    }
    if (isDiagram()) {
        
    } else {
        getEditor().hideSearch()
    }
}

function updateHistoryList() {
    var items = getRecent()
    sortAndMarkColors(items)
    var recent = getWidget("recent")
    recent.setItems(items)
}

function sortAndMarkColors(items) {
    var list = items.map(takeIdAndWhenOpened)
    list.sort(compareWhenOpened)
    var idToOrdinal = {}
    list.forEach((item, i) => {idToOrdinal[item.id] = i})
    items.forEach(
        item => setItemBackground(item, idToOrdinal, items.length)
    )
    items.sort(byText)
}

function setItemBackground(item, idToOrdinal, length) {
    var ordinal = idToOrdinal[item.id]
    var value = Math.floor(55 * (1 - ordinal / length))
    var blue = 200 + value
    item.background = "rgb(" + blue + ", " + blue + ", 255)"
}

function byText(left, right) {
    var le = left.text.toLowerCase()
    var ri = right.text.toLowerCase()
    if (le < ri) {
        return -1
    } else if (le > ri) {
        return 1
    } else {
        return 0
    }
}


function compareWhenOpened(left, right) {
    if (left.whenOpened < right.whenOpened) {
        return -1
    } else if (left.whenOpened > right.whenOpened) {
        return 1
    } else {
        return 0
    }
}

function takeIdAndWhenOpened(item) {
    return {
        id: item.id,
        whenOpened: item.whenOpened
    }
}

function validateFolderName(name) {
    var error = checkFileName(name)
    if (error) {
        return translate(error)
    } else {
        return null
    }
}

function validateModuleName(name, language) {
    var error = Utils.validateModuleName(name, language)
    if (error) {
        return translate(error)
    } else {
        return null
    }
}



function validateSpaceName(name) {
    name = name || ""
    name = makeSpaceName(name)
    if (name) {
        var error = Utils.checkSpaceName(name)
        if (error) {
            return translate(error)
        } else {
            return null
        }
    } else {
        return translate("ERR_EMPTY_NAME")
    }
}

function willChangeScreen() {
    browser.showWorking()
    globs.saver = null
    globs.current.id = null
    globs.current.type = null
    cancelPolling()
}

function SpacesLoader() {
  var _self = this;
  _self.type_name = "SpacesLoader";
  _self.state = "Start";
  _self.onData = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return SpacesLoader_Start_onData(_self, data);
    }
    else if (_state_ == "GettingHistory") {
      return SpacesLoader_GettingHistory_onData(_self, data);
    }
    else if (_state_ == "GettingAccount") {
      return SpacesLoader_GettingAccount_onData(_self, data);
    }
    return null;
  };
  _self.onError = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return SpacesLoader_Start_onError(_self, data);
    }
    else if (_state_ == "GettingHistory") {
      return SpacesLoader_GettingHistory_onError(_self, data);
    }
    else if (_state_ == "GettingAccount") {
      return SpacesLoader_GettingAccount_onError(_self, data);
    }
    return null;
  };
}

function FolderGetter() {
  var _self = this;
  _self.type_name = "FolderGetter";
  _self.state = "Start";
  _self.onData = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return FolderGetter_Start_onData(_self, data);
    }
    else if (_state_ == "GettingFolder") {
      return FolderGetter_GettingFolder_onData(_self, data);
    }
    return null;
  };
  _self.onError = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return FolderGetter_Start_onError(_self, data);
    }
    else if (_state_ == "GettingFolder") {
      return FolderGetter_GettingFolder_onError(_self, data);
    }
    return null;
  };
}

function TreeNodeExpander() {
  var _self = this;
  _self.type_name = "TreeNodeExpander";
  _self.state = "Start";
  _self.onData = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return TreeNodeExpander_Start_onData(_self, data);
    }
    else if (_state_ == "GettingFolder") {
      return TreeNodeExpander_GettingFolder_onData(_self, data);
    }
    return null;
  };
  _self.onError = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return TreeNodeExpander_Start_onError(_self, data);
    }
    else if (_state_ == "GettingFolder") {
      return TreeNodeExpander_GettingFolder_onError(_self, data);
    }
    return null;
  };
}

function TreeClicker() {
  var _self = this;
  _self.type_name = "TreeClicker";
  _self.state = "Start";
  _self.onData = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return TreeClicker_Start_onData(_self, data);
    }
    else if (_state_ == "ShowingFolder") {
      return TreeClicker_ShowingFolder_onData(_self, data);
    }
    return null;
  };
  _self.onError = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return TreeClicker_Start_onError(_self, data);
    }
    else if (_state_ == "ShowingFolder") {
      return TreeClicker_ShowingFolder_onError(_self, data);
    }
    return null;
  };
}

function FolderShower() {
  var _self = this;
  _self.type_name = "FolderShower";
  _self.state = "Start";
  _self.onData = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return FolderShower_Start_onData(_self, data);
    }
    else if (_state_ == "GettingFolder") {
      return FolderShower_GettingFolder_onData(_self, data);
    }
    else if (_state_ == "GettingTheme") {
      return FolderShower_GettingTheme_onData(_self, data);
    }
    else if (_state_ == "LoadingFonts") {
      return FolderShower_LoadingFonts_onData(_self, data);
    }
    return null;
  };
  _self.onError = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return FolderShower_Start_onError(_self, data);
    }
    else if (_state_ == "GettingFolder") {
      return FolderShower_GettingFolder_onError(_self, data);
    }
    else if (_state_ == "GettingTheme") {
      return FolderShower_GettingTheme_onError(_self, data);
    }
    else if (_state_ == "LoadingFonts") {
      return FolderShower_LoadingFonts_onError(_self, data);
    }
    return null;
  };
}

function GoToFolderMachine() {
  var _self = this;
  _self.type_name = "GoToFolderMachine";
  _self.state = "Start";
  _self.onData = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return GoToFolderMachine_Start_onData(_self, data);
    }
    else if (_state_ == "ShowingFolder") {
      return GoToFolderMachine_ShowingFolder_onData(_self, data);
    }
    else if (_state_ == "Expanding") {
      return GoToFolderMachine_Expanding_onData(_self, data);
    }
    else if (_state_ == "Done") {
      return GoToFolderMachine_Done_onData(_self, data);
    }
    return null;
  };
  _self.onError = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return GoToFolderMachine_Start_onError(_self, data);
    }
    else if (_state_ == "ShowingFolder") {
      return GoToFolderMachine_ShowingFolder_onError(_self, data);
    }
    else if (_state_ == "Expanding") {
      return GoToFolderMachine_Expanding_onError(_self, data);
    }
    else if (_state_ == "Done") {
      return GoToFolderMachine_Done_onError(_self, data);
    }
    return null;
  };
}

function FontLoadingMachine() {
  var _self = this;
  _self.type_name = "FontLoadingMachine";
  _self.state = "Start";
  _self.onData = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return FontLoadingMachine_Start_onData(_self, data);
    }
    else if (_state_ == "OnFont") {
      return FontLoadingMachine_OnFont_onData(_self, data);
    }
    else if (_state_ == "Sleeping") {
      return FontLoadingMachine_Sleeping_onData(_self, data);
    }
    return null;
  };
  _self.onError = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return FontLoadingMachine_Start_onError(_self, data);
    }
    else if (_state_ == "OnFont") {
      return FontLoadingMachine_OnFont_onError(_self, data);
    }
    else if (_state_ == "Sleeping") {
      return FontLoadingMachine_Sleeping_onError(_self, data);
    }
    return null;
  };
}

function Saver() {
  var _self = this;
  _self.type_name = "Saver";
  _self.state = "Loading";
  _self.loaded = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Loading") {
      return Saver_Loading_loaded(_self, data);
    }
    else if (_state_ == "BeforePolling") {
      return Saver_BeforePolling_default(_self, data);
    }
    else if (_state_ == "Polling") {
      return Saver_Polling_default(_self, data);
    }
    return null;
  };
  _self.notSaved = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Loading") {
      return Saver_Loading_default(_self, data);
    }
    else if (_state_ == "BeforePolling") {
      return Saver_BeforePolling_default(_self, data);
    }
    else if (_state_ == "Polling") {
      return Saver_Polling_default(_self, data);
    }
    else if (_state_ == "Saving") {
      return Saver_Saving_notSaved(_self, data);
    }
    return null;
  };
  _self.onError = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Loading") {
      return Saver_Loading_default(_self, data);
    }
    else if (_state_ == "BeforePolling") {
      return Saver_BeforePolling_default(_self, data);
    }
    else if (_state_ == "Polling") {
      return Saver_Polling_onError(_self, data);
    }
    else if (_state_ == "Saving") {
      return Saver_Saving_onError(_self, data);
    }
    return null;
  };
  _self.onTag = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Loading") {
      return Saver_Loading_default(_self, data);
    }
    else if (_state_ == "BeforePolling") {
      return Saver_BeforePolling_default(_self, data);
    }
    else if (_state_ == "Polling") {
      return Saver_Polling_onTag(_self, data);
    }
    return null;
  };
  _self.save = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Loading") {
      return Saver_Loading_save(_self, data);
    }
    else if (_state_ == "BeforePolling") {
      return Saver_BeforePolling_save(_self, data);
    }
    else if (_state_ == "Polling") {
      return Saver_Polling_save(_self, data);
    }
    else if (_state_ == "Saving") {
      return Saver_Saving_save(_self, data);
    }
    return null;
  };
  _self.saved = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Loading") {
      return Saver_Loading_default(_self, data);
    }
    else if (_state_ == "BeforePolling") {
      return Saver_BeforePolling_default(_self, data);
    }
    else if (_state_ == "Polling") {
      return Saver_Polling_default(_self, data);
    }
    else if (_state_ == "Saving") {
      return Saver_Saving_saved(_self, data);
    }
    return null;
  };
  _self.timeout = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Loading") {
      return Saver_Loading_default(_self, data);
    }
    else if (_state_ == "BeforePolling") {
      return Saver_BeforePolling_timeout(_self, data);
    }
    else if (_state_ == "Polling") {
      return Saver_Polling_default(_self, data);
    }
    return null;
  };
}

function RootSpacesShower() {
  var _self = this;
  _self.type_name = "RootSpacesShower";
  _self.state = "Start";
  _self.onData = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return RootSpacesShower_Start_onData(_self, data);
    }
    else if (_state_ == "GettingProjects") {
      return RootSpacesShower_GettingProjects_onData(_self, data);
    }
    return null;
  };
  _self.onError = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return RootSpacesShower_Start_onError(_self, data);
    }
    else if (_state_ == "GettingProjects") {
      return RootSpacesShower_GettingProjects_onError(_self, data);
    }
    return null;
  };
}

function RootFolderShower() {
  var _self = this;
  _self.type_name = "RootFolderShower";
  _self.state = "Start";
  _self.onData = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return RootFolderShower_Start_onData(_self, data);
    }
    else if (_state_ == "ShowingSpaces") {
      return RootFolderShower_ShowingSpaces_onData(_self, data);
    }
    else if (_state_ == "ShowingFolder") {
      return RootFolderShower_ShowingFolder_onData(_self, data);
    }
    return null;
  };
  _self.onError = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return RootFolderShower_Start_onError(_self, data);
    }
    else if (_state_ == "ShowingSpaces") {
      return RootFolderShower_ShowingSpaces_onError(_self, data);
    }
    else if (_state_ == "ShowingFolder") {
      return RootFolderShower_ShowingFolder_onError(_self, data);
    }
    return null;
  };
}

function DiagramCreator() {
  var _self = this;
  _self.type_name = "DiagramCreator";
  _self.state = "ChooseDiagramType";
  _self.cancel = function(data) {
    var _state_ = _self.state;
    if (_state_ == "ChooseDiagramType") {
      return DiagramCreator_ChooseDiagramType_cancel(_self, data);
    }
    return null;
  };
  _self.onData = function(data) {
    var _state_ = _self.state;
    if (_state_ == "ChooseDiagramType") {
      return DiagramCreator_ChooseDiagramType_onData(_self, data);
    }
    else if (_state_ == "EnterName") {
      return DiagramCreator_EnterName_onData(_self, data);
    }
    else if (_state_ == "SendToServer") {
      return DiagramCreator_SendToServer_onData(_self, data);
    }
    else if (_state_ == "Done") {
      return DiagramCreator_Done_onData(_self, data);
    }
    return null;
  };
  _self.onError = function(data) {
    var _state_ = _self.state;
    if (_state_ == "ChooseDiagramType") {
      return DiagramCreator_ChooseDiagramType_onError(_self, data);
    }
    else if (_state_ == "EnterName") {
      return DiagramCreator_EnterName_onError(_self, data);
    }
    else if (_state_ == "SendToServer") {
      return DiagramCreator_SendToServer_onError(_self, data);
    }
    else if (_state_ == "Done") {
      return DiagramCreator_Done_onError(_self, data);
    }
    return null;
  };
}

function FolderCreator() {
  var _self = this;
  _self.type_name = "FolderCreator";
  _self.state = "EnterName";
  _self.cancel = function(data) {
    var _state_ = _self.state;
    if (_state_ == "CreateFolder") {
      return FolderCreator_CreateFolder_cancel(_self, data);
    }
    return null;
  };
  _self.onData = function(data) {
    var _state_ = _self.state;
    if (_state_ == "EnterName") {
      return FolderCreator_EnterName_onData(_self, data);
    }
    else if (_state_ == "SetModuleProps") {
      return FolderCreator_SetModuleProps_onData(_self, data);
    }
    else if (_state_ == "CreateFolder") {
      return FolderCreator_CreateFolder_onData(_self, data);
    }
    else if (_state_ == "Done") {
      return FolderCreator_Done_onData(_self, data);
    }
    return null;
  };
  _self.onError = function(data) {
    var _state_ = _self.state;
    if (_state_ == "EnterName") {
      return FolderCreator_EnterName_onError(_self, data);
    }
    else if (_state_ == "SetModuleProps") {
      return FolderCreator_SetModuleProps_onError(_self, data);
    }
    else if (_state_ == "CreateFolder") {
      return FolderCreator_CreateFolder_onError(_self, data);
    }
    else if (_state_ == "Done") {
      return FolderCreator_Done_onError(_self, data);
    }
    return null;
  };
}

function Paster() {
  var _self = this;
  _self.type_name = "Paster";
  _self.state = "Start";
  _self.onData = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return Paster_Start_onData(_self, data);
    }
    else if (_state_ == "RunningCopy") {
      return Paster_RunningCopy_onData(_self, data);
    }
    else if (_state_ == "RunningOperation") {
      return Paster_RunningOperation_onData(_self, data);
    }
    else if (_state_ == "GettingHistory") {
      return Paster_GettingHistory_onData(_self, data);
    }
    else if (_state_ == "Reloading") {
      return Paster_Reloading_onData(_self, data);
    }
    return null;
  };
  _self.onError = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return Paster_Start_onError(_self, data);
    }
    else if (_state_ == "RunningCopy") {
      return Paster_RunningCopy_onError(_self, data);
    }
    else if (_state_ == "RunningOperation") {
      return Paster_RunningOperation_onError(_self, data);
    }
    else if (_state_ == "GettingHistory") {
      return Paster_GettingHistory_onError(_self, data);
    }
    else if (_state_ == "Reloading") {
      return Paster_Reloading_onError(_self, data);
    }
    return null;
  };
}

function FolderCutterDeleter() {
  var _self = this;
  _self.type_name = "FolderCutterDeleter";
  _self.state = "Start";
  _self.cancel = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Sure1") {
      return FolderCutterDeleter_Sure1_cancel(_self, data);
    }
    return null;
  };
  _self.onData = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return FolderCutterDeleter_Start_onData(_self, data);
    }
    else if (_state_ == "Sure1") {
      return FolderCutterDeleter_Sure1_onData(_self, data);
    }
    else if (_state_ == "RunningOperation") {
      return FolderCutterDeleter_RunningOperation_onData(_self, data);
    }
    else if (_state_ == "GettingHistory") {
      return FolderCutterDeleter_GettingHistory_onData(_self, data);
    }
    else if (_state_ == "Reloading") {
      return FolderCutterDeleter_Reloading_onData(_self, data);
    }
    return null;
  };
  _self.onError = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return FolderCutterDeleter_Start_onError(_self, data);
    }
    else if (_state_ == "Sure1") {
      return FolderCutterDeleter_Sure1_onError(_self, data);
    }
    else if (_state_ == "RunningOperation") {
      return FolderCutterDeleter_RunningOperation_onError(_self, data);
    }
    else if (_state_ == "GettingHistory") {
      return FolderCutterDeleter_GettingHistory_onError(_self, data);
    }
    else if (_state_ == "Reloading") {
      return FolderCutterDeleter_Reloading_onError(_self, data);
    }
    return null;
  };
}

function Renamer() {
  var _self = this;
  _self.type_name = "Renamer";
  _self.state = "Start";
  _self.onData = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return Renamer_Start_onData(_self, data);
    }
    else if (_state_ == "EnteringName") {
      return Renamer_EnteringName_onData(_self, data);
    }
    else if (_state_ == "SendingToServer") {
      return Renamer_SendingToServer_onData(_self, data);
    }
    return null;
  };
  _self.onError = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return Renamer_Start_onError(_self, data);
    }
    else if (_state_ == "EnteringName") {
      return Renamer_EnteringName_onError(_self, data);
    }
    else if (_state_ == "SendingToServer") {
      return Renamer_SendingToServer_onError(_self, data);
    }
    return null;
  };
}

function DrakonRenamer() {
  var _self = this;
  _self.type_name = "DrakonRenamer";
  _self.state = "SaveNewName";
  _self.onData = function(data) {
    var _state_ = _self.state;
    if (_state_ == "SaveNewName") {
      return DrakonRenamer_SaveNewName_onData(_self, data);
    }
    else if (_state_ == "SavingChanges") {
      return DrakonRenamer_SavingChanges_onData(_self, data);
    }
    else if (_state_ == "Reloaded") {
      return DrakonRenamer_Reloaded_onData(_self, data);
    }
    return null;
  };
  _self.onError = function(data) {
    var _state_ = _self.state;
    if (_state_ == "SaveNewName") {
      return DrakonRenamer_SaveNewName_default(_self, data);
    }
    else if (_state_ == "SavingChanges") {
      return DrakonRenamer_SavingChanges_onError(_self, data);
    }
    else if (_state_ == "Reloaded") {
      return DrakonRenamer_Reloaded_onError(_self, data);
    }
    return null;
  };
}

function DescriptionChanger() {
  var _self = this;
  _self.type_name = "DescriptionChanger";
  _self.state = "GetFolder";
  _self.onData = function(data) {
    var _state_ = _self.state;
    if (_state_ == "GetFolder") {
      return DescriptionChanger_GetFolder_onData(_self, data);
    }
    else if (_state_ == "ShowDialog") {
      return DescriptionChanger_ShowDialog_onData(_self, data);
    }
    else if (_state_ == "UserInput") {
      return DescriptionChanger_UserInput_onData(_self, data);
    }
    else if (_state_ == "Saving") {
      return DescriptionChanger_Saving_onData(_self, data);
    }
    return null;
  };
  _self.onError = function(data) {
    var _state_ = _self.state;
    if (_state_ == "GetFolder") {
      return DescriptionChanger_GetFolder_onError(_self, data);
    }
    else if (_state_ == "ShowDialog") {
      return DescriptionChanger_ShowDialog_onError(_self, data);
    }
    else if (_state_ == "UserInput") {
      return DescriptionChanger_UserInput_onError(_self, data);
    }
    else if (_state_ == "Saving") {
      return DescriptionChanger_Saving_onError(_self, data);
    }
    return null;
  };
}

function RecentGetter() {
  var _self = this;
  _self.type_name = "RecentGetter";
  _self.state = "Start";
  _self.onData = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return RecentGetter_Start_onData(_self, data);
    }
    else if (_state_ == "GettingHistory") {
      return RecentGetter_GettingHistory_onData(_self, data);
    }
    return null;
  };
  _self.onError = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return RecentGetter_Start_onError(_self, data);
    }
    else if (_state_ == "GettingHistory") {
      return RecentGetter_GettingHistory_onError(_self, data);
    }
    return null;
  };
}

function AccessShower() {
  var _self = this;
  _self.type_name = "AccessShower";
  _self.state = "Start";
  _self.addUser = function(data) {
    var _state_ = _self.state;
    if (_state_ == "AccessScreen") {
      return AccessShower_AccessScreen_addUser(_self, data);
    }
    return null;
  };
  _self.cancel = function(data) {
    var _state_ = _self.state;
    if (_state_ == "AccessScreen") {
      return AccessShower_AccessScreen_cancel(_self, data);
    }
    else if (_state_ == "AddingUser") {
      return AccessShower_AddingUser_cancel(_self, data);
    }
    return null;
  };
  _self.onData = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return AccessShower_Start_onData(_self, data);
    }
    else if (_state_ == "GettingAccess") {
      return AccessShower_GettingAccess_onData(_self, data);
    }
    else if (_state_ == "AccessScreen") {
      return AccessShower_AccessScreen_onData(_self, data);
    }
    else if (_state_ == "AddingUser") {
      return AccessShower_AddingUser_onData(_self, data);
    }
    else if (_state_ == "SavingAccess") {
      return AccessShower_SavingAccess_onData(_self, data);
    }
    return null;
  };
  _self.onError = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return AccessShower_Start_onError(_self, data);
    }
    else if (_state_ == "GettingAccess") {
      return AccessShower_GettingAccess_onError(_self, data);
    }
    else if (_state_ == "AccessScreen") {
      return AccessShower_AccessScreen_onError(_self, data);
    }
    else if (_state_ == "SavingAccess") {
      return AccessShower_SavingAccess_onError(_self, data);
    }
    return null;
  };
  _self.removeUser = function(data) {
    var _state_ = _self.state;
    if (_state_ == "AccessScreen") {
      return AccessShower_AccessScreen_removeUser(_self, data);
    }
    return null;
  };
  _self.togglePublic = function(data) {
    var _state_ = _self.state;
    if (_state_ == "AccessScreen") {
      return AccessShower_AccessScreen_togglePublic(_self, data);
    }
    return null;
  };
}

function PaneStatus() {
  var _self = this;
  _self.type_name = "PaneStatus";
  _self.state = "Hidden";
  _self.hide = function(msg) {
    var _state_ = _self.state;
    if (_state_ == "Visible") {
      return PaneStatus_Visible_hide(_self, msg);
    }
    return null;
  };
  _self.show = function(msg) {
    var _state_ = _self.state;
    if (_state_ == "Hidden") {
      return PaneStatus_Hidden_show(_self, msg);
    }
    return null;
  };
  _self.tab = function(msg) {
    var _state_ = _self.state;
    if (_state_ == "Hidden") {
      return PaneStatus_Hidden_tab(_self, msg);
    }
    else if (_state_ == "Visible") {
      return PaneStatus_Visible_tab(_self, msg);
    }
    return null;
  };
}

function ProjectDeleter() {
  var _self = this;
  _self.type_name = "ProjectDeleter";
  _self.state = "Start";
  _self.cancel = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Sure1") {
      return ProjectDeleter_Sure1_cancel(_self, data);
    }
    else if (_state_ == "Sure2") {
      return ProjectDeleter_Sure2_cancel(_self, data);
    }
    return null;
  };
  _self.onData = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return ProjectDeleter_Start_onData(_self, data);
    }
    else if (_state_ == "Sure1") {
      return ProjectDeleter_Sure1_onData(_self, data);
    }
    else if (_state_ == "Sure2") {
      return ProjectDeleter_Sure2_onData(_self, data);
    }
    else if (_state_ == "Deleting") {
      return ProjectDeleter_Deleting_onData(_self, data);
    }
    return null;
  };
  _self.onError = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return ProjectDeleter_Start_onError(_self, data);
    }
    else if (_state_ == "Sure1") {
      return ProjectDeleter_Sure1_onError(_self, data);
    }
    else if (_state_ == "Waiting") {
      return ProjectDeleter_Waiting_onError(_self, data);
    }
    else if (_state_ == "Sure2") {
      return ProjectDeleter_Sure2_onError(_self, data);
    }
    else if (_state_ == "Deleting") {
      return ProjectDeleter_Deleting_onError(_self, data);
    }
    return null;
  };
  _self.timeout = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Waiting") {
      return ProjectDeleter_Waiting_timeout(_self, data);
    }
    return null;
  };
}

function ProjectCreator() {
  var _self = this;
  _self.type_name = "ProjectCreator";
  _self.state = "Start";
  _self.onData = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return ProjectCreator_Start_onData(_self, data);
    }
    else if (_state_ == "EnterName") {
      return ProjectCreator_EnterName_onData(_self, data);
    }
    else if (_state_ == "Creating") {
      return ProjectCreator_Creating_onData(_self, data);
    }
    return null;
  };
  _self.onError = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return ProjectCreator_Start_onError(_self, data);
    }
    else if (_state_ == "EnterName") {
      return ProjectCreator_EnterName_onError(_self, data);
    }
    else if (_state_ == "Creating") {
      return ProjectCreator_Creating_onError(_self, data);
    }
    return null;
  };
}

function TrashLoader() {
  var _self = this;
  _self.type_name = "TrashLoader";
  _self.state = "GetAccount";
  _self.onData = function(data) {
    var _state_ = _self.state;
    if (_state_ == "GetAccount") {
      return TrashLoader_GetAccount_onData(_self, data);
    }
    else if (_state_ == "GettingAccount") {
      return TrashLoader_GettingAccount_onData(_self, data);
    }
    else if (_state_ == "GettingSpaceRubbish") {
      return TrashLoader_GettingSpaceRubbish_onData(_self, data);
    }
    return null;
  };
  _self.onError = function(data) {
    var _state_ = _self.state;
    if (_state_ == "GetAccount") {
      return TrashLoader_GetAccount_onError(_self, data);
    }
    else if (_state_ == "GettingAccount") {
      return TrashLoader_GettingAccount_onError(_self, data);
    }
    else if (_state_ == "GettingSpaceRubbish") {
      return TrashLoader_GettingSpaceRubbish_onError(_self, data);
    }
    return null;
  };
  _self.timeout = function(data) {
    var _state_ = _self.state;
    if (_state_ == "GettingSpaceRubbish") {
      return TrashLoader_GettingSpaceRubbish_timeout(_self, data);
    }
    return null;
  };
}

function ThrowTrash() {
  var _self = this;
  _self.type_name = "ThrowTrash";
  _self.state = "GetAccount";
  _self.onData = function(data) {
    var _state_ = _self.state;
    if (_state_ == "GetAccount") {
      return ThrowTrash_GetAccount_onData(_self, data);
    }
    else if (_state_ == "GettingAccount") {
      return ThrowTrash_GettingAccount_onData(_self, data);
    }
    else if (_state_ == "Throwing") {
      return ThrowTrash_Throwing_onData(_self, data);
    }
    return null;
  };
  _self.onError = function(data) {
    var _state_ = _self.state;
    if (_state_ == "GetAccount") {
      return ThrowTrash_GetAccount_onError(_self, data);
    }
    else if (_state_ == "GettingAccount") {
      return ThrowTrash_GettingAccount_onError(_self, data);
    }
    else if (_state_ == "Throwing") {
      return ThrowTrash_Throwing_onError(_self, data);
    }
    return null;
  };
  _self.timeout = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Throwing") {
      return ThrowTrash_Throwing_timeout(_self, data);
    }
    return null;
  };
}

function RootTrashShower() {
  var _self = this;
  _self.type_name = "RootTrashShower";
  _self.state = "Start";
  _self.onData = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return RootTrashShower_Start_onData(_self, data);
    }
    else if (_state_ == "ShowingSpaces") {
      return RootTrashShower_ShowingSpaces_onData(_self, data);
    }
    else if (_state_ == "ShowingTrash") {
      return RootTrashShower_ShowingTrash_onData(_self, data);
    }
    return null;
  };
  _self.onError = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return RootTrashShower_Start_onError(_self, data);
    }
    else if (_state_ == "ShowingSpaces") {
      return RootTrashShower_ShowingSpaces_onError(_self, data);
    }
    else if (_state_ == "ShowingTrash") {
      return RootTrashShower_ShowingTrash_onError(_self, data);
    }
    return null;
  };
}

function Restorer() {
  var _self = this;
  _self.type_name = "Restorer";
  _self.state = "Start";
  _self.onData = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return Restorer_Start_onData(_self, data);
    }
    else if (_state_ == "Restoring") {
      return Restorer_Restoring_onData(_self, data);
    }
    else if (_state_ == "Going") {
      return Restorer_Going_onData(_self, data);
    }
    return null;
  };
  _self.onError = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return Restorer_Start_onError(_self, data);
    }
    else if (_state_ == "Restoring") {
      return Restorer_Restoring_onError(_self, data);
    }
    else if (_state_ == "Going") {
      return Restorer_Going_onError(_self, data);
    }
    return null;
  };
}

function RootRecentLoader() {
  var _self = this;
  _self.type_name = "RootRecentLoader";
  _self.state = "Start";
  _self.onData = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return RootRecentLoader_Start_onData(_self, data);
    }
    else if (_state_ == "GettingProjects") {
      return RootRecentLoader_GettingProjects_onData(_self, data);
    }
    return null;
  };
  _self.onError = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return RootRecentLoader_Start_onError(_self, data);
    }
    else if (_state_ == "GettingProjects") {
      return RootRecentLoader_GettingProjects_onError(_self, data);
    }
    return null;
  };
}

function UserAdder() {
  var _self = this;
  _self.type_name = "UserAdder";
  _self.state = "Primary";
  _self.cancel = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Primary") {
      return UserAdder_Primary_cancel(_self, data);
    }
    else if (_state_ == "Typing") {
      return UserAdder_Typing_cancel(_self, data);
    }
    return null;
  };
  _self.choose = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Primary") {
      return UserAdder_Primary_choose(_self, data);
    }
    else if (_state_ == "Typing") {
      return UserAdder_Typing_choose(_self, data);
    }
    return null;
  };
  _self.onData = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Primary") {
      return UserAdder_Primary_onData(_self, data);
    }
    return null;
  };
  _self.onError = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Primary") {
      return UserAdder_Primary_onError(_self, data);
    }
    return null;
  };
  _self.onInput = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Primary") {
      return UserAdder_Primary_onInput(_self, data);
    }
    else if (_state_ == "Typing") {
      return UserAdder_Typing_onInput(_self, data);
    }
    return null;
  };
  _self.timeout = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Typing") {
      return UserAdder_Typing_timeout(_self, data);
    }
    return null;
  };
}

function Sharer() {
  var _self = this;
  _self.type_name = "Sharer";
  _self.state = "UserInput";
  _self.access = function(data) {
    var _state_ = _self.state;
    if (_state_ == "UserInput") {
      return Sharer_UserInput_access(_self, data);
    }
    return null;
  };
  _self.cancel = function(data) {
    var _state_ = _self.state;
    if (_state_ == "UserInput") {
      return Sharer_UserInput_cancel(_self, data);
    }
    else if (_state_ == "Access") {
      return Sharer_Access_cancel(_self, data);
    }
    return null;
  };
  _self.onData = function(data) {
    var _state_ = _self.state;
    if (_state_ == "UserInput") {
      return Sharer_UserInput_onData(_self, data);
    }
    else if (_state_ == "Access") {
      return Sharer_Access_onData(_self, data);
    }
    return null;
  };
}

function OwnSaver() {
  var _self = this;
  _self.type_name = "OwnSaver";
  _self.state = "Start";
  _self.cancel = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return OwnSaver_Start_default(_self, data);
    }
    else if (_state_ == "Dialog") {
      return OwnSaver_Dialog_cancel(_self, data);
    }
    else if (_state_ == "Subdialog") {
      return OwnSaver_Subdialog_cancel(_self, data);
    }
    return null;
  };
  _self.login = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return OwnSaver_Start_default(_self, data);
    }
    else if (_state_ == "Dialog") {
      return OwnSaver_Dialog_login(_self, data);
    }
    return null;
  };
  _self.onData = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return OwnSaver_Start_onData(_self, data);
    }
    else if (_state_ == "Subdialog") {
      return OwnSaver_Subdialog_onData(_self, data);
    }
    return null;
  };
  _self.signup = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return OwnSaver_Start_default(_self, data);
    }
    else if (_state_ == "Dialog") {
      return OwnSaver_Dialog_signup(_self, data);
    }
    return null;
  };
}

function LoginMachine() {
  var _self = this;
  _self.type_name = "LoginMachine";
  _self.state = "Start";
  _self.cancel = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return LoginMachine_Start_default(_self, data);
    }
    else if (_state_ == "Dialog") {
      return LoginMachine_Dialog_cancel(_self, data);
    }
    return null;
  };
  _self.login = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return LoginMachine_Start_default(_self, data);
    }
    else if (_state_ == "Dialog") {
      return LoginMachine_Dialog_login(_self, data);
    }
    return null;
  };
  _self.onData = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return LoginMachine_Start_onData(_self, data);
    }
    else if (_state_ == "Saving") {
      return LoginMachine_Saving_onData(_self, data);
    }
    return null;
  };
  _self.onError = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return LoginMachine_Start_default(_self, data);
    }
    else if (_state_ == "Saving") {
      return LoginMachine_Saving_onError(_self, data);
    }
    return null;
  };
}

function SignupMachine() {
  var _self = this;
  _self.type_name = "SignupMachine";
  _self.state = "Start";
  _self.cancel = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return SignupMachine_Start_default(_self, data);
    }
    else if (_state_ == "Dialog") {
      return SignupMachine_Dialog_cancel(_self, data);
    }
    return null;
  };
  _self.onData = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return SignupMachine_Start_onData(_self, data);
    }
    else if (_state_ == "Saving") {
      return SignupMachine_Saving_onData(_self, data);
    }
    return null;
  };
  _self.onError = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return SignupMachine_Start_default(_self, data);
    }
    else if (_state_ == "Saving") {
      return SignupMachine_Saving_onError(_self, data);
    }
    return null;
  };
  _self.signup = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return SignupMachine_Start_default(_self, data);
    }
    else if (_state_ == "Dialog") {
      return SignupMachine_Dialog_signup(_self, data);
    }
    return null;
  };
}

function TryMeLoader() {
  var _self = this;
  _self.type_name = "TryMeLoader";
  _self.state = "Start";
  _self.onData = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return TryMeLoader_Start_onData(_self, data);
    }
    else if (_state_ == "LoadingExample") {
      return TryMeLoader_LoadingExample_onData(_self, data);
    }
    else if (_state_ == "LoadingFonts") {
      return TryMeLoader_LoadingFonts_onData(_self, data);
    }
    else if (_state_ == "Sleeping") {
      return TryMeLoader_Sleeping_onData(_self, data);
    }
    return null;
  };
  _self.onError = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return TryMeLoader_Start_onError(_self, data);
    }
    else if (_state_ == "LoadingExample") {
      return TryMeLoader_LoadingExample_onError(_self, data);
    }
    else if (_state_ == "LoadingFonts") {
      return TryMeLoader_LoadingFonts_onError(_self, data);
    }
    else if (_state_ == "Sleeping") {
      return TryMeLoader_Sleeping_onError(_self, data);
    }
    return null;
  };
}

function DiagramSearch() {
  var _self = this;
  _self.type_name = "DiagramSearch";
  _self.state = "Start";
  _self.onData = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return DiagramSearch_Start_onData(_self, data);
    }
    else if (_state_ == "Folders") {
      return DiagramSearch_Folders_onData(_self, data);
    }
    else if (_state_ == "ItemsPause") {
      return DiagramSearch_ItemsPause_onData(_self, data);
    }
    else if (_state_ == "Items") {
      return DiagramSearch_Items_onData(_self, data);
    }
    return null;
  };
  _self.onError = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return DiagramSearch_Start_default(_self, data);
    }
    else if (_state_ == "Folders") {
      return DiagramSearch_Folders_onError(_self, data);
    }
    else if (_state_ == "ItemsPause") {
      return DiagramSearch_ItemsPause_onError(_self, data);
    }
    else if (_state_ == "Items") {
      return DiagramSearch_Items_onError(_self, data);
    }
    return null;
  };
}

function DullSearch() {
  var _self = this;
  _self.type_name = "DullSearch";
  _self.state = "Start";
  _self.dummy = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return DullSearch_Start_dummy(_self, data);
    }
    return null;
  };
  _self.onInput = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return DullSearch_Start_onInput(_self, data);
    }
    else if (_state_ == "Dummy") {
      return DullSearch_Dummy_onInput(_self, data);
    }
    return null;
  };
  _self.stop = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return DullSearch_Start_stop(_self, data);
    }
    else if (_state_ == "Dummy") {
      return DullSearch_Dummy_stop(_self, data);
    }
    return null;
  };
}

function InputThrottle() {
  var _self = this;
  _self.type_name = "InputThrottle";
  _self.state = "Idle";
  _self.onInput = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Idle") {
      return InputThrottle_Idle_onInput(_self, data);
    }
    else if (_state_ == "Waiting") {
      return InputThrottle_Waiting_onInput(_self, data);
    }
    return null;
  };
  _self.timeout = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Idle") {
      return InputThrottle_Idle_default(_self, data);
    }
    else if (_state_ == "Waiting") {
      return InputThrottle_Waiting_timeout(_self, data);
    }
    return null;
  };
}

function DashboardShower() {
  var _self = this;
  _self.type_name = "DashboardShower";
  _self.state = "Start";
  _self.onData = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return DashboardShower_Start_onData(_self, data);
    }
    else if (_state_ == "GettingProjects") {
      return DashboardShower_GettingProjects_onData(_self, data);
    }
    return null;
  };
  _self.onError = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return DashboardShower_Start_onError(_self, data);
    }
    else if (_state_ == "GettingProjects") {
      return DashboardShower_GettingProjects_onError(_self, data);
    }
    return null;
  };
}

function ReferencesSearch() {
  var _self = this;
  _self.type_name = "ReferencesSearch";
  _self.state = "Start";
  _self.onData = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return ReferencesSearch_Start_onData(_self, data);
    }
    else if (_state_ == "ItemsPause") {
      return ReferencesSearch_ItemsPause_onData(_self, data);
    }
    else if (_state_ == "Items") {
      return ReferencesSearch_Items_onData(_self, data);
    }
    return null;
  };
  _self.onError = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return ReferencesSearch_Start_default(_self, data);
    }
    else if (_state_ == "ItemsPause") {
      return ReferencesSearch_ItemsPause_onError(_self, data);
    }
    else if (_state_ == "Items") {
      return ReferencesSearch_Items_onError(_self, data);
    }
    return null;
  };
}

function ObjectCreator() {
  var _self = this;
  _self.type_name = "ObjectCreator";
  _self.state = "Start";
  _self.cancel = function(msg) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return ObjectCreator_Start_default(_self, msg);
    }
    else if (_state_ == "ChooseObjectType") {
      return ObjectCreator_ChooseObjectType_cancel(_self, msg);
    }
    return null;
  };
  _self.onData = function(msg) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return ObjectCreator_Start_onData(_self, msg);
    }
    else if (_state_ == "ChooseObjectType") {
      return ObjectCreator_ChooseObjectType_onData(_self, msg);
    }
    return null;
  };
}

function FolderCreatorGeneric() {
  var _self = this;
  _self.type_name = "FolderCreatorGeneric";
  _self.state = "CreateFolder";
  _self.onData = function(data) {
    var _state_ = _self.state;
    if (_state_ == "CreateFolder") {
      return FolderCreatorGeneric_CreateFolder_onData(_self, data);
    }
    else if (_state_ == "SaveProps") {
      return FolderCreatorGeneric_SaveProps_onData(_self, data);
    }
    else if (_state_ == "CreateMain") {
      return FolderCreatorGeneric_CreateMain_onData(_self, data);
    }
    else if (_state_ == "Expand") {
      return FolderCreatorGeneric_Expand_onData(_self, data);
    }
    else if (_state_ == "RefreshParent") {
      return FolderCreatorGeneric_RefreshParent_onData(_self, data);
    }
    else if (_state_ == "Done") {
      return FolderCreatorGeneric_Done_onData(_self, data);
    }
    return null;
  };
  _self.onError = function(data) {
    var _state_ = _self.state;
    if (_state_ == "CreateFolder") {
      return FolderCreatorGeneric_CreateFolder_onError(_self, data);
    }
    else if (_state_ == "SaveProps") {
      return FolderCreatorGeneric_SaveProps_onError(_self, data);
    }
    else if (_state_ == "CreateMain") {
      return FolderCreatorGeneric_CreateMain_onError(_self, data);
    }
    else if (_state_ == "Expand") {
      return FolderCreatorGeneric_Expand_onError(_self, data);
    }
    else if (_state_ == "RefreshParent") {
      return FolderCreatorGeneric_RefreshParent_onError(_self, data);
    }
    else if (_state_ == "Done") {
      return FolderCreatorGeneric_Done_onError(_self, data);
    }
    return null;
  };
}

function PropChanger() {
  var _self = this;
  _self.type_name = "PropChanger";
  _self.state = "GetProps";
  _self.cancel = function(data) {
    var _state_ = _self.state;
    if (_state_ == "SaveModuleProps") {
      return PropChanger_SaveModuleProps_cancel(_self, data);
    }
    return null;
  };
  _self.onData = function(data) {
    var _state_ = _self.state;
    if (_state_ == "GetProps") {
      return PropChanger_GetProps_onData(_self, data);
    }
    else if (_state_ == "SetModuleProps") {
      return PropChanger_SetModuleProps_onData(_self, data);
    }
    else if (_state_ == "SaveModuleProps") {
      return PropChanger_SaveModuleProps_onData(_self, data);
    }
    else if (_state_ == "Done") {
      return PropChanger_Done_onData(_self, data);
    }
    return null;
  };
  _self.onError = function(data) {
    var _state_ = _self.state;
    if (_state_ == "GetProps") {
      return PropChanger_GetProps_onError(_self, data);
    }
    else if (_state_ == "SetModuleProps") {
      return PropChanger_SetModuleProps_onError(_self, data);
    }
    else if (_state_ == "SaveModuleProps") {
      return PropChanger_SaveModuleProps_onError(_self, data);
    }
    else if (_state_ == "Done") {
      return PropChanger_Done_onError(_self, data);
    }
    return null;
  };
}

function GenUrlShower() {
  var _self = this;
  _self.type_name = "GenUrlShower";
  _self.state = "GetUrl";
  _self.cancel = function(msg) {
    var _state_ = _self.state;
    if (_state_ == "Done") {
      return GenUrlShower_Done_cancel(_self, msg);
    }
    return null;
  };
  _self.onData = function(msg) {
    var _state_ = _self.state;
    if (_state_ == "GetUrl") {
      return GenUrlShower_GetUrl_onData(_self, msg);
    }
    else if (_state_ == "ShowUrl") {
      return GenUrlShower_ShowUrl_onData(_self, msg);
    }
    else if (_state_ == "Done") {
      return GenUrlShower_Done_onData(_self, msg);
    }
    return null;
  };
  _self.onError = function(msg) {
    var _state_ = _self.state;
    if (_state_ == "GetUrl") {
      return GenUrlShower_GetUrl_onError(_self, msg);
    }
    else if (_state_ == "ShowUrl") {
      return GenUrlShower_ShowUrl_onError(_self, msg);
    }
    else if (_state_ == "Done") {
      return GenUrlShower_Done_onError(_self, msg);
    }
    return null;
  };
}

function BuildManager() {
  var _self = this;
  _self.type_name = "BuildManager";
  _self.state = "Idle";
  _self.build = function(msg) {
    var _state_ = _self.state;
    if (_state_ == "Idle") {
      return BuildManager_Idle_build(_self, msg);
    }
    return null;
  };
  _self.buildModule = function(msg) {
    var _state_ = _self.state;
    if (_state_ == "Idle") {
      return BuildManager_Idle_buildModule(_self, msg);
    }
    return null;
  };
  _self.cancel = function(msg) {
    var _state_ = _self.state;
    if (_state_ == "Idle") {
      return BuildManager_Idle_cancel(_self, msg);
    }
    else if (_state_ == "ChoosingModule") {
      return BuildManager_ChoosingModule_cancel(_self, msg);
    }
    return null;
  };
  _self.cancelBuild = function(msg) {
    var _state_ = _self.state;
    if (_state_ == "Building") {
      return BuildManager_Building_cancelBuild(_self, msg);
    }
    return null;
  };
  _self.onData = function(msg) {
    var _state_ = _self.state;
    if (_state_ == "GettingModules") {
      return BuildManager_GettingModules_onData(_self, msg);
    }
    else if (_state_ == "ChoosingModule") {
      return BuildManager_ChoosingModule_onData(_self, msg);
    }
    else if (_state_ == "Building") {
      return BuildManager_Building_onData(_self, msg);
    }
    return null;
  };
  _self.onError = function(msg) {
    var _state_ = _self.state;
    if (_state_ == "GettingModules") {
      return BuildManager_GettingModules_onError(_self, msg);
    }
    else if (_state_ == "Building") {
      return BuildManager_Building_onError(_self, msg);
    }
    return null;
  };
  _self.showBuild = function(msg) {
    var _state_ = _self.state;
    if (_state_ == "Idle") {
      return BuildManager_Idle_showBuild(_self, msg);
    }
    return null;
  };
}

function Builder() {
  var _self = this;
  _self.type_name = "Builder";
  _self.state = "Created";
  _self.cancelBuild = function(msg) {
    var _state_ = _self.state;
    if (_state_ == "Created") {
      return Builder_Created_default(_self, msg);
    }
    else if (_state_ == "Starting") {
      return Builder_Starting_cancelBuild(_self, msg);
    }
    else if (_state_ == "Working") {
      return Builder_Working_cancelBuild(_self, msg);
    }
    else if (_state_ == "Checking") {
      return Builder_Checking_cancelBuild(_self, msg);
    }
    return null;
  };
  _self.onData = function(msg) {
    var _state_ = _self.state;
    if (_state_ == "Created") {
      return Builder_Created_onData(_self, msg);
    }
    else if (_state_ == "Starting") {
      return Builder_Starting_onData(_self, msg);
    }
    else if (_state_ == "Checking") {
      return Builder_Checking_onData(_self, msg);
    }
    return null;
  };
  _self.onError = function(msg) {
    var _state_ = _self.state;
    if (_state_ == "Created") {
      return Builder_Created_default(_self, msg);
    }
    else if (_state_ == "Starting") {
      return Builder_Starting_onError(_self, msg);
    }
    else if (_state_ == "Checking") {
      return Builder_Checking_onError(_self, msg);
    }
    return null;
  };
  _self.timeout = function(msg) {
    var _state_ = _self.state;
    if (_state_ == "Created") {
      return Builder_Created_default(_self, msg);
    }
    else if (_state_ == "Working") {
      return Builder_Working_timeout(_self, msg);
    }
    return null;
  };
}

function SignupMachineShort() {
  var _self = this;
  _self.type_name = "SignupMachineShort";
  _self.state = "Start";
  _self.cancel = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return SignupMachineShort_Start_default(_self, data);
    }
    else if (_state_ == "Done") {
      return SignupMachineShort_Done_cancel(_self, data);
    }
    return null;
  };
  _self.onData = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return SignupMachineShort_Start_onData(_self, data);
    }
    return null;
  };
  _self.signup = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return SignupMachineShort_Start_default(_self, data);
    }
    else if (_state_ == "Done") {
      return SignupMachineShort_Done_signup(_self, data);
    }
    return null;
  };
}

function DiaPropChanger() {
  var _self = this;
  _self.type_name = "DiaPropChanger";
  _self.state = "GetProps";
  _self.cancel = function(data) {
    var _state_ = _self.state;
    if (_state_ == "SaveProps") {
      return DiaPropChanger_SaveProps_cancel(_self, data);
    }
    return null;
  };
  _self.onData = function(data) {
    var _state_ = _self.state;
    if (_state_ == "GetProps") {
      return DiaPropChanger_GetProps_onData(_self, data);
    }
    else if (_state_ == "SetModuleProps") {
      return DiaPropChanger_SetModuleProps_onData(_self, data);
    }
    else if (_state_ == "SaveProps") {
      return DiaPropChanger_SaveProps_onData(_self, data);
    }
    else if (_state_ == "Saved") {
      return DiaPropChanger_Saved_onData(_self, data);
    }
    return null;
  };
  _self.onError = function(data) {
    var _state_ = _self.state;
    if (_state_ == "GetProps") {
      return DiaPropChanger_GetProps_onError(_self, data);
    }
    else if (_state_ == "SetModuleProps") {
      return DiaPropChanger_SetModuleProps_onError(_self, data);
    }
    else if (_state_ == "SaveProps") {
      return DiaPropChanger_SaveProps_onError(_self, data);
    }
    else if (_state_ == "Saved") {
      return DiaPropChanger_Saved_onError(_self, data);
    }
    return null;
  };
}

function ProjectSaver() {
  var _self = this;
  _self.type_name = "ProjectSaver";
  _self.state = "Start";
  _self.cancel = function(data) {
    var _state_ = _self.state;
    if (_state_ == "SaveScreen") {
      return ProjectSaver_SaveScreen_cancel(_self, data);
    }
    return null;
  };
  _self.onData = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return ProjectSaver_Start_onData(_self, data);
    }
    else if (_state_ == "SaveScreen") {
      return ProjectSaver_SaveScreen_onData(_self, data);
    }
    else if (_state_ == "BuildingZip") {
      return ProjectSaver_BuildingZip_onData(_self, data);
    }
    return null;
  };
  _self.onError = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return ProjectSaver_Start_onError(_self, data);
    }
    else if (_state_ == "SaveScreen") {
      return ProjectSaver_SaveScreen_onError(_self, data);
    }
    else if (_state_ == "BuildingZip") {
      return ProjectSaver_BuildingZip_onError(_self, data);
    }
    return null;
  };
}

function ProjectLoader() {
  var _self = this;
  _self.type_name = "ProjectLoader";
  _self.state = "Start";
  _self.cancel = function(data) {
    var _state_ = _self.state;
    if (_state_ == "ChoosingFile") {
      return ProjectLoader_ChoosingFile_cancel(_self, data);
    }
    else if (_state_ == "Confirm") {
      return ProjectLoader_Confirm_cancel(_self, data);
    }
    return null;
  };
  _self.onData = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return ProjectLoader_Start_onData(_self, data);
    }
    else if (_state_ == "ChoosingFile") {
      return ProjectLoader_ChoosingFile_onData(_self, data);
    }
    else if (_state_ == "Confirm") {
      return ProjectLoader_Confirm_onData(_self, data);
    }
    else if (_state_ == "Loading") {
      return ProjectLoader_Loading_onData(_self, data);
    }
    return null;
  };
  _self.onError = function(data) {
    var _state_ = _self.state;
    if (_state_ == "Start") {
      return ProjectLoader_Start_onError(_self, data);
    }
    else if (_state_ == "ChoosingFile") {
      return ProjectLoader_ChoosingFile_onError(_self, data);
    }
    else if (_state_ == "Confirm") {
      return ProjectLoader_Confirm_onError(_self, data);
    }
    else if (_state_ == "Loading") {
      return ProjectLoader_Loading_onError(_self, data);
    }
    return null;
  };
}

function AllBuilder() {
  var _self = this;
  _self.type_name = "AllBuilder";
  _self.state = "Created";
  _self.cancelBuild = function(msg) {
    var _state_ = _self.state;
    if (_state_ == "Created") {
      return AllBuilder_Created_default(_self, msg);
    }
    else if (_state_ == "Working") {
      return AllBuilder_Working_cancelBuild(_self, msg);
    }
    else if (_state_ == "Checking") {
      return AllBuilder_Checking_cancelBuild(_self, msg);
    }
    return null;
  };
  _self.onData = function(msg) {
    var _state_ = _self.state;
    if (_state_ == "Created") {
      return AllBuilder_Created_onData(_self, msg);
    }
    else if (_state_ == "Checking") {
      return AllBuilder_Checking_onData(_self, msg);
    }
    return null;
  };
  _self.onError = function(msg) {
    var _state_ = _self.state;
    if (_state_ == "Created") {
      return AllBuilder_Created_default(_self, msg);
    }
    else if (_state_ == "Checking") {
      return AllBuilder_Checking_onError(_self, msg);
    }
    return null;
  };
  _self.timeout = function(msg) {
    var _state_ = _self.state;
    if (_state_ == "Created") {
      return AllBuilder_Created_default(_self, msg);
    }
    else if (_state_ == "Working") {
      return AllBuilder_Working_timeout(_self, msg);
    }
    return null;
  };
}


globs = createState()
bindHandlers()

this.init = init
this.getCurrent = getCurrent
this.getDiagram = getDiagram
this.onEvent = onEvent
this.saveUserSettings = saveUserSettings
this.saveChanges = saveChanges
this.onStateChange = onStateChange
this.undo = undo
this.redo = redo
this.onSearchItem = onSearchItem
this.resetSearch = resetSearch
this.goToFolder = goToFolder
this.goToProjectsNoArg = goToProjectsNoArg
this.findReferences = findReferences
this.quickSearch = quickSearch
this.build = build
this.showBuild = showBuild
this.cancelBuild = cancelBuild
this.createModule = createModule
this.changeDiagramProperties = changeDiagramProperties
this.saveApp = saveApp
this.goToFolder = goToFolder
this.startBuildAll = startBuildAll
this.shutdown = shutdown
}

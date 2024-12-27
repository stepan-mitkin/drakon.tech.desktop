(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const { createDrakonTechGenerator } = require("./drakontechgen")

window.generateJavaScript = function (name, root, getObjectByHandle, onError, onData) {
    var genOptions = {
        toTree: window.toTree,
        escodegen: window.escodegen,
        esprima: window.esprima,
        name: name,
        root: root,
        getObjectByHandle: getObjectByHandle,
        onError: onError,
        onData: onData
    }

    return createDrakonTechGenerator(genOptions)    
}

},{"./drakontechgen":2}],2:[function(require,module,exports){
const { findFirst, addRange } = require("./tools")

async function pause(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function createDrakonTechGenerator(options) {
    var gAsts = {}
    var gBranches = {}
    var simpleSilhouette
    var nextId = 2
    var self = {}
    var state = "idle"
    var scopes = {}
    var project = createScope(options.name, "module")
    var failed = false

    function generateId(prefix) {
        var id = prefix + "_" + nextId
        nextId++
        return id
    }


    function stop() {
        state = undefined
    }

    function createScope(name, type, parent) {
        var scope = {
            name: name,
            type: type,
            parent: parent,
            args: {},
            declared: {},
            auto: {},
            all: {},
            loop: {},
            algoprops: {},
            functions: {},
            classes: {},
            assignments: {}
        }
        scopes[name] = scope
        return scope
    }

    async function readChildren(folder) {
        var result = []
        for (var filepath of folder.children) {
            var child = await options.getObjectByHandle(filepath)
            if (child) {
                result.push(child)
            }
        }
        return result
    }



    function isModule(folder) {
        return folder.type === "drakon" && folder.name === "module"
    }

    function isClass(folder) {
        return folder.type === "drakon" && folder.name === "class"
    }

    function isFunction(folder) {
        return folder.type === "drakon" && folder.keywords.function
    }

    function isAlgoprop(folder) {
        return folder.type === "drakon" && folder.keywords.algoprop
    }

    function addFunction(scope, folder) {
        var name = folder.name
        if (name in scope.all) {
            reportError("Function name is not unique", folder.path, undefined, name)
        }
        scope.functions[name] = folder
        scope.all[name] = "function"
    }

    function addDeclaration(scope, name) {
        scope.declared[name] = true
    }

    function addAssigned(scope, name) {
        scope.assignments[name] = true
    }

    function addArgument(fun, name) {
        fun.arguments.push(name)
        if (name in fun.scope.declared) {
            reportError("Argument name is not unique", fun.path, "params", name)
        }
        addDeclaration(fun.scope, name)
    }

    function checkCancellation() {
        if (!state) {
            var error = new Error("Cancelled")
            error.cancelled = true
            throw error
        }
    }
    async function traverseModuleItem(folder) {
        checkCancellation()
        if (folder.type === "folder") {
            var children = await readChildren(folder)
            var ctr = findFirst(children, isClass)
            if (ctr) {
                var cls = createClass(folder)
                for (var child of children) {
                    await traverseClassItem(cls, child)
                }
            } else {
                for (var child of children) {
                    await traverseModuleItem(child)
                }
            }
        } else if (isModule(folder)) {
            reportError("module not expected here", folder.path)
        } else if (isFunction(folder)) {
            addFunction(project, folder)
        } else if (isAlgoprop(folder)) {
            createGlobalAlgoprop(folder)
        }
    }

    async function jsPreprocess() {
        var rootFolder = await options.getObjectByHandle(options.root)
        for (var childPath of rootFolder.children) {
            var child = await options.getObjectByHandle(childPath)
            if (!child) { continue }
            if (isClass(child)) {
                reportError("class not expected in the root folder", childPath)
            } else if (isModule(child)) {
                project.moduleInit = child
            } else {
                await traverseModuleItem(child)
            }
        }
        
        if (project.moduleInit) {
            parseItemsCore(project.moduleInit, parseNormal)
        }

        for (var name in project.functions) {
            checkCancellation()
            parseFunctionItems(project.functions[name], project.name)
        }
    }

    function buildAsts() {        
        if (project.moduleInit) {
            buildAst(project.moduleInit)
        }        
        for (var name in project.functions) {
            checkCancellation()
            buildAst(project.functions[name])
        }
    }

    function createFunction(name, arguments) {
        if (!arguments) { arguments = []}
        return {
            type: "FunctionDeclaration",
            id: createIdentifier(name),
            params: arguments.map(createIdentifier),
            body: createBlock(),
            generator: false,
            expression: false,
            async: false
        }
    }

    function createBlock() {
        return {
            type: "BlockStatement",
            body: []
        }
    }

    function addActionToAst(step, body) {
        if (!step.content) { return }
        for (var expr of step.content) {
            body.push(expr)
        }
    }

    function createNot(operand) {
        return {
            type: "UnaryExpression",
            operator: "!",
            argument: operand
        }
    }

    function createOr(left, right) {
        return {
            type: "LogicalExpression",
            operator: "||",
            left: left,
            right: right
        }
    }

    function createAnd(left, right) {
        return {
            type: "LogicalExpression",
            operator: "&&",
            left: left,
            right: right
        }
    }

    function createEqual(left, right) {
        return {
            type: "BinaryExpression",
            operator: "===",
            left: left,
            right: right
        }
    }

    function decodeQuestionContent(content) {
        if (content.operator === "not") {
            var decoded = decodeQuestionContent(content.operand)
            if (decoded.type === "BinaryExpression" && decoded.operator === "===") {
                decoded.operator = "!=="
                return decoded
            }
            return createNot(decodeQuestionContent(content.operand))
        }

        if (content.operator === "and") {
            var left = decodeQuestionContent(content.left)
            var right = decodeQuestionContent(content.right)
            return createAnd(left, right)
        }

        if (content.operator === "or") {
            var left = decodeQuestionContent(content.left)
            var right = decodeQuestionContent(content.right)
            return createOr(left, right)
        }

        if (content.operator === "equal") {
            var left = decodeQuestionContent(content.left)
            var right = decodeQuestionContent(content.right)
            return createEqual(left, right)
        }

        return content
    }

    function addQuestionToAst(step, body) {
        var content = decodeQuestionContent(step.content)
        var node = createIfNode(content)
        convertNodesToAst(step.yes, node.consequent.body)
        if (step.no.length > 0) {
            node.alternate = createBlock()
            convertNodesToAst(step.no, node.alternate.body)
        }
        body.push(node)
    }

    function createIfNode(content) {
        return {
            type: "IfStatement",
            test: content,
            consequent: createBlock()
        }
    }

    function addLoopToAst(step, body) {
        var node
        if (step.content) {
            node = step.content
        } else {
            node = createWhileTrue()
        }
        convertNodesToAst(step.body, node.body.body)
        body.push(node)
    }

    function createWhileTrue() {
        return {
            type: "WhileStatement",
            test: {
                type: "Literal",
                value: true,
                raw: "true"
            },
            body: createBlock()
        }
    }

    function createThrow(message) {
        return {
            type: "ThrowStatement",
            argument: {
                type: "NewExpression",
                "callee": createIdentifier("Error"),
                "arguments": [message]
            }
        }
    }

    function createPlus(left, right) {
        return {
            type: "BinaryExpression",
            operator: "+",
            left: left,
            right: right
        }
    }

    function createStringLiteral(value) {
        return {
            type: "Literal",
            value: value,
            raw: JSON.stringify(value)
        }
    }

    function addErrorToAst(step, body) {
        var message
        if (step.content) {
            message = createPlus(createStringLiteral(step.message + ": "), step.content)
        } else {
            message = createStringLiteral(step.message)
        }
        var expr = createThrow(message)
        body.push(expr)
    }

    function createBreak() {
        return {
            type: "BreakStatement",
            label: null
        }
    }

    function addAddressToAst(step, body) {
        if (simpleSilhouette) {
            var nextBranch = gBranches[step.content]
            convertNodesToAst(nextBranch.body, body)
        } else {
            var assi = createAssignment(createIdentifier("_state_"), createStringLiteral(step.content))
            var statement = createExpression(assi)
            body.push(statement)
        }
    }

    function convertNodesToAst(steps, body) {
        for (var step of steps) {
            if (step.type === "action") {
                addActionToAst(step, body)
            } else if (step.type === "question") {
                addQuestionToAst(step, body)
            } else if (step.type === "loop") {
                addLoopToAst(step, body)
            } else if (step.type === "error") {
                addErrorToAst(step, body)
            } else if (step.type === "break") {
                body.push(createBreak())
            } else if (step.type === "address") {
                addAddressToAst(step, body)
            } else {
                throw new Error("Unexpected step type: " + step.type)
            }
        }
    }

    function treeToAst(fun, tree) {
        var funAst = createFunction(fun.name, fun.arguments)
        var functionBody = funAst.body.body
        if (tree.branches.length === 0) {
            return funAst
        } else if (tree.branches.length === 1) {
            convertNodesToAst(tree.branches[0].body, functionBody)
        } else {
            gBranches = {}
            for (var branch of tree.branches) {
                if (!branch.name) {
                    onError("Branch name cannot be empty", fun.path, branch.id)
                    return funAst
                }
                if (branch.name in gBranches) {
                    onError("Non-unique branch name", fun.path, branch.id)
                    return funAst
                }
                gBranches[branch.name] = branch
            }
            if (isSimpleSilhouette(tree.branches)) {
                simpleSilhouette = true
                convertNodesToAst(tree.branches[0].body, functionBody)
            } else {
                simpleSilhouette = false
                var firstName = tree.branches[0].name
                functionBody.push(createExpression(createAssignment(createIdentifier("_state_"), createStringLiteral(firstName))))
                var loop = createWhileTrue()
                functionBody.push(loop)
                var loopBody = loop.body.body
                var select = createSwitch(createIdentifier("_state_"))
                loopBody.push(select)
                var ordinal = 0
                for (var branch of tree.branches) {
                    var caseClause = createCase(createStringLiteral(branch.name))
                    select.cases.push(caseClause)
                    var caseBody = caseClause.consequent
                    var lastBranch = (ordinal === tree.branches.length - 1 && hasEnd(fun))
                    if (lastBranch) {
                        var assi = createAssignment(createIdentifier("_state_"), createIdentifier("undefined"))
                        caseBody.push(createExpression(assi))
                    }
                    convertNodesToAst(branch.body, caseBody)
                    if (!endsWithReturn(caseBody)) {
                        caseBody.push(createBreak())
                    }
                    ordinal++
                }
                var defClause = createCase(null)
                defClause.consequent.push(createReturn(null))
                select.cases.push(defClause)

            }
        }
        return funAst
    }

    function endsWithReturn(caseBody) {
        if (caseBody.length === 0) {return false}
        var last = caseBody[caseBody.length - 1]
        return (last.type === "ReturnStatement" || last.type === "ThrowStatement")
    }

    function hasEnd(fun) {
        for (var id in fun.items) {
            var item = fun.items[id]
            if (item.type === "end") {return true}
        }
        return false
    }

    function createReturn(value) {
        return {
            type: "ReturnStatement",
            argument: value
        }
    }

    function createSwitch(value) {
        return {
            type: "SwitchStatement",
            discriminant: value,
            cases: []
        }
    }

    function createCase(value) {
        return {
            type: "SwitchCase",
            test: value,
            consequent: []
        }
    }

    function isSimpleSilhouette(branches) {
        for (var i = 0; i < branches.length; i++) {
            var branch = branches[i]
            if (branch.refs > 1) {
                if (i === branches.length - 1) {
                    return simpleBranch(branch)
                }
                return false
            }
        }
        return true
    }

    function simpleBranch(branch) {
        if (branch.body.length === 1) {
            if (branch.body[0].type === "action") {
                return true
            }
        }
        return false
    }

    function buildAst(fun) {
        var ast
        try {
            var drakonJson = JSON.stringify(fun, null, 4)
            var treeStr = options.toTree(drakonJson, fun.name, fun.path, options.language)
            var tree = JSON.parse(treeStr)
            var ast = treeToAst(fun, tree)
            try {
                options.escodegen.generate(ast)
            } catch (ex) {
                console.log(ex.message)
                console.log(fun.name, fun.path)    
                console.log(JSON.stringify(ast, null, 4))            
                reportError("Internal error", fun.path)
                ast = createIdentifier("error")
            }
            gAsts[fun.path] = ast
        } catch (ex) {
            console.log(ex)
            reportError(ex.message, fun.path, ex.nodeId)
        }
    }

    function parseParams(params) {
        params = params || ""
        var parts = params.split("\n")
        return parts
            .map(part => part.trim())
            .filter(part => !!part)
    }

    function parseNormal(content, itemId) {
        var wrapped = "async function _wpd_() {" + content + "\n}"
        var parsed = options.esprima.parseScript(wrapped, { loc: false })
        var result = parsed.body[0].body.body
        result.forEach(node => {node.itemId = itemId})
        return result
    }

    function parseItemContent(fun, item, parser) {
        var content = item.content || ""
        content = content.trim()
        if (content) {
            try {
                item.content = parser(content, item.id)
            } catch (ex) {
                reportError(ex.message, fun.path, item.id)
                delete item.content
            }
        } else {
            delete item.content
        }
    }

    function ensureHasContent(fun, item) {
        if (!item.content || item.content.length === 0) {
            reportError("Icon cannot be empty", fun.path, item.id)
            return false
        }
        return true
    }

    function ensureExpression(fun, item) {
        var expression = getExpression(item)
        if (!expression) {
            reportError("A value expression is expected here", fun.path, item.id)
            return false
        }
        item.content = expression
        return true
    }
    function getExpression(item) {
        if (!item.content) {
            return undefined
        }
        if (item.content.length !== 1) { return undefined }
        var expr = item.content[0]
        if (expr.type === "ExpressionStatement") {
            if (expr.expression.type === "AssignmentExpression") {
                return undefined
            }
            if (expr.expression.type === "SequenceExpression") {
                return undefined
            }
            return expr.expression
        }

        return undefined
    }

    function buildSubscopesAssignment(context, expr, itemId) {
        var left = expr.left
        var right = expr.right
        if (left.type === "Identifier") {
            addAssigned(context.scope, left.name)
        } else {
            scanForAssignments(context, left, itemId)
        }
        scanForAssignments(context, right, itemId)
    }

    function buildSubscopesDeclaration(context, node, itemId) {
        if (!context.scope.allowDeclare) {
            reportError("Variable declarations allowed only in module and class constructors", context.fun.path, itemId)
            return
        }

        for (var dec of node.declarations) {
            if (dec.type === "VariableDeclarator") {
                var id = dec.id
                if (id.type === "Identifier") {
                    addDeclaration(context.scope, id.name)
                } else if (id.type === "ObjectPattern") {
                    for (var prop of id.properties) {
                        if (prop.key.type === "Identifier") {
                            addDeclaration(context.scope, prop.key.name)
                        }
                    }
                }
            }
        }
    }

    function addFunctionParamsToScope(scope, node) {
        if (node.params) {
            for (var param of node.params) {
                if (param.type === "Identifier") {
                    addDeclaration(scope, param.name)
                }
            }
        }
    }

    function scanForAssignments(context, node, itemId) {
        if (!node) { return }
        if (Array.isArray(node)) {
            for (var child of node) {
                scanForAssignments(context, child, itemId)
            }
        } else if (typeof node === "object" && node.type) {
            if (node.itemId) {
                itemId = node.itemId
            }
            if ((node.type === "ArrowFunctionExpression" || node.type === "FunctionExpression") && node.body.type === "BlockStatement") {
                var name = generateId("scope")
                node.scope = createScope(name, node.type, context.scope.name)
                addFunctionParamsToScope(node.scope, node)
                addVariableDeclarationsCore(node.scope, context.fun, node.body.body, itemId)
            } else if (node.type === "AssignmentExpression") {
                buildSubscopesAssignment(context, node, itemId)
            } else if (node.type === "VariableDeclaration") {
                buildSubscopesDeclaration(context, node, itemId)
            } else {
                for (var key in node) {
                    var value = node[key]
                    scanForAssignments(context, value, itemId)
                }
            }
        }
    }

    function parseActionContent(fun, item, parser) {
        parseItemContent(fun, item, parser)
    }

    function addLoopVar(scope, variable) {
        scope.all[variable] = "loop"
        scope.loop[variable] = true
    }

    function createForOf(variable, collectionExpr) {
        return {
            type: "ForOfStatement",
            left: createIdentifier(variable),
            right: collectionExpr,
            body: createBlock()
        }
    }

    function createForIn(variable, collectionExpr) {
        return {
            type: "ForInStatement",
            left: createIdentifier(variable),
            right: collectionExpr,
            body: createBlock(),
            each: false
        }
    }

    function createFor(init, test, update) {
        return {
            type: "ForStatement",
            init: init,
            test: test,
            update: update,
            body: {
                type: "BlockStatement",
                body: []
            }
        }
    }

    function createGetValue(valueVar, keyVar, collection) {
        return {
            type: "AssignmentExpression",
            operator: "=",
            left: createIdentifier(valueVar),
            right: {
                type: "MemberExpression",
                computed: true,
                object: collection,
                property: createIdentifier(keyVar)
            }
        }
    }

    function createExpression(expression) {
        return {
            type: "ExpressionStatement",
            expression: expression
        }
    }

    function insertActionBefore(fun, beforeId, expression) {
        var id = generateId("_item_")
        var item = {
            id: id,
            type: "action",
            content: [createExpression(expression)],
            one: beforeId
        }

        for (var itemId in fun.items) {
            var existingItem = fun.items[itemId]
            if (existingItem.one === beforeId) {
                existingItem.one = id
            }
            if (existingItem.two === beforeId) {
                existingItem.two = id
            }
        }

        fun.items[id] = item
    }

    function parseLoopContent(fun, item, parser) {
        parseItemContent(fun, item, parser)
        if (ensureHasContent(fun, item)) {
            switch (item.content.length) {
                case 2:
                    var expr1 = item.content[0]
                    var expr2 = item.content[1]
                    if (expr1.type !== "ExpressionStatement" || expr2.type !== "ExpressionStatement") {
                        reportBadLoop(fun, item)
                        return
                    }
                    var first = expr1.expression
                    var second = expr2.expression
                    if (second.type !== "Identifier") {
                        var varName = generateId("_collection")
                        var oldContent = second
                        second = createIdentifier(varName)
                        var newContent = createAssignment(createIdentifier(varName), oldContent)
                        insertActionBefore(fun, item.id, newContent)
                    }
                    if (first.type === "Identifier") {
                        item.subtype = "array"
                        item.variable = first.name
                        item.content = createForOf(item.variable, second)
                        item.content.itemId = item.id
                        addAssigned(fun.scope, item.variable)
                    } else if (first.type === "SequenceExpression") {
                        if (first.expressions.length !== 2) {
                            reportBadLoop(fun, item)
                            return
                        } else {
                            var var1 = first.expressions[0]
                            var var2 = first.expressions[1]
                            if (var1.type !== "Identifier" || var2.type !== "Identifier") {
                                reportBadLoop(fun, item)
                            } else {
                                item.subtype = "dictionary"
                                item.keyVariable = var1.name
                                item.valueVariable = var2.name
                                insertActionBefore(fun, item.one, createGetValue(item.valueVariable, item.keyVariable, second))
                                item.content = createForIn(item.keyVariable, second)
                                item.content.itemId = item.id
                                addAssigned(fun.scope, item.keyVariable)
                            }
                        }
                    }
                    break
                case 3:
                    var init = stripExpression(item.content[0])
                    var test = stripExpression(item.content[1])
                    var update = stripExpression(item.content[2])
                    item.content = createFor(init, test, update)
                    item.content.itemId = item.id
                    break
                default:
                    reportBadLoop(fun, item)
                    break
            }
        }
    }

    function stripExpression(node) {
        if (node.type === "ExpressionStatement") {
            return node.expression
        }

        return node
    }

    function createIdentifier(name) {
        return {
            type: "Identifier",
            name: name
        }
    }

    function createAssignment(identifier, expression) {
        return {
            type: "AssignmentExpression",
            operator: "=",
            left: identifier,
            right: expression
        }
    }

    function createDeclaration(name, expression) {
        return {
            type: "VariableDeclaration",
            declarations: [
                {
                    type: "VariableDeclarator",
                    id: createIdentifier(name),
                    init: expression
                }
            ],
            kind: "var"
        }
    }

    function createDeclarations(names) {
        return {
            type: "VariableDeclaration",
            declarations: names.map(name => {
                return {
                    type: "VariableDeclarator",
                    id: createIdentifier(name),
                    init: null
                }
            }),
            kind: "var"
        }
    }    

    function parseSelectContent(fun, item, parser) {
        parseItemContent(fun, item, parser)
        if (!ensureHasContent(fun, item)) {
            return
        }
        if (!ensureExpression(fun, item)) {
            return
        }

        var expr = item.content
        if (expr.type !== "Identifier") {
            var varName = generateId("_selectValue")
            item.content = createIdentifier(varName)
            var newContent = createAssignment(createIdentifier(varName), expr)
            insertActionBefore(fun, item.id, newContent)
        }
    }

    function parseCaseContent(fun, item, parser) {
        parseItemContent(fun, item, parser)
        if (item.two) {
            ensureHasContent(fun, item)
        }
        if (item.content) {
            ensureExpression(fun, item)
        }
    }

    function parseQuestionContent(fun, item, parser) {
        parseItemContent(fun, item, parser)
        if (!ensureHasContent(fun, item)) { return }
        ensureExpression(fun, item)
    }

    function reportBadLoop(fun, item) {
        reportError("Error in loop icon", fun.path, item.id)
        delete item.content
    }

    function parseFunctionItems(fun, parentScope) {
        if (fun.name in scopes) {
            reportError("Name is not unique", fun.path, undefined, fun.name)
        }
        fun.scope = createScope(fun.name, "function", parentScope)
        fun.arguments = []
        var params = parseParams(fun.params)
        params.forEach(param => addArgument(fun, param))
        parseItemsCore(fun, parseNormal)
    }

    function parseItemsCore(fun, parser) {
        fun.items = fun.items || {}
        for (var itemId in fun.items) {
            var item = fun.items[itemId]
            item.id = itemId
            switch (item.type) {
                case "action":
                    parseActionContent(fun, item, parser)
                    break;
                case "loopbegin":
                    parseLoopContent(fun, item, parser)
                    break;
                case "select":
                    parseSelectContent(fun, item, parser)
                    break;
                case "case":
                    parseCaseContent(fun, item, parser)
                    break;
                case "question":
                    parseQuestionContent(fun, item, parser)
                    break;
                case "branch":
                case "comment":
                case "arrow-loop":
                case "loopend":
                case "end":
                    break;
                default:
                    reportError("Unsupported icon type", fun.path, itemId, item.type)
                    break;
            }
        }
    }

    function reportError(message, filename, nodeId, data) {
        failed = true
        options.onError({
            message: message,
            filename: filename,
            nodeId: nodeId,
            data: data
        })
    }

    function createRootNode() {
        return {
            type: "Program",
            body: [],
            sourceType: "module"
        }
    }

    function createDotMember(obj, propertyName) {
        return {
            type: "MemberExpression",
            computed: false,
            object: obj,
            property: createIdentifier(propertyName)
        }
    }

    function createExportNode(exported) {
        var properties = exported.map(name => [createIdentifier(name), createIdentifier(name)])
        return createExpression(
            {
                type: "AssignmentExpression",
                operator: "=",
                left: createDotMember(createIdentifier("module"), "exports"),
                right: createObjectExpression(properties)
            }
        )
    }

    function createInitProperty(key, value) {
        return {
            type: "Property",
            key: key,
            value: value,
            computed: false,
            kind: "init",
            method: false,
            shorthand: true
        }
    }

    function createObjectExpression(properties) {
        return {
            type: "ObjectExpression",
            properties: properties.map(prop => createInitProperty(
                prop[0],
                prop[1]
                ))
        }
    }

    function generateSourceCode() {        
        var root = createRootNode()
        if (project.moduleInit) {
            var modAst = gAsts[project.moduleInit.path]
            addRange(root.body, modAst.body.body)
        }
        var names = Object.keys(project.functions)
        names.sort()
        var exported = []
        for (var name of names) {            
            checkCancellation()
            var fun = project.functions[name]
            var ast = gAsts[fun.path]
            root.body.push(ast)
            if (fun.keywords.export) {
                exported.push(name)
            }
        }
        if (exported.length > 0) {
            root.body.push(createExportNode(exported))
        }
        var src = options.escodegen.generate(root)
        return src
    }

    function scanAsts() {
        project.allowDeclare = true
        if (project.moduleInit) {
            addVariableDeclarations(project, project.moduleInit)
        }
        for (var name in project.functions) {
            var fun = project.functions[name]
            addVariableDeclarations(fun.scope, fun)
        }
    }

    function addVariableDeclarations(scope, fun) {        
        var ast = gAsts[fun.path]  
        addVariableDeclarationsCore(scope, fun, ast.body.body, undefined)
    }

    function isDeclared(scope, name) {        
        if (name in scope.all) {
            return true
        }

        if (name in scope.declared) {
            return true
        }

        if (scope.parent) {
            var parent = scopes[scope.parent]
            if (name in parent.assignments) {
                return true
            }
            return isDeclared(parent, name)
        }
    }

    function calculateAuto(scope) {
        for (var name in scope.assignments) {
            if (!isDeclared(scope, name)) {
                scope.auto[name] = true
            }
        }

        for (var name in scope.declared) {
            scope.all[name] = "declared"
        }

        for (var name in scope.auto) {
            scope.all[name] = "auto"
        }
    }

    function addVariableDeclarationsCore(scope, fun, body, itemId) {        
        var context = {
            scope:scope,
            fun:fun
        }
        scanForAssignments(context, body, itemId)
        calculateAuto(scope)
        var auto = Object.keys(scope.auto)
        auto.sort()
        if (auto.length !== 0) {
            body.unshift(createDeclarations(auto))
        }
    }    

    async function run() {
        if (state !== "idle") {
            throw new Error("Invalid state " + state)
        }
        try {
            gAsts = {}
            gBranches = {}
            await jsPreprocess()
            if (failed) {
                return
            }
            buildAsts()
            await pause(1)
            if (failed) {
                return
            }
            checkCancellation()
            scanAsts()
            await pause(1)
            if (failed) {
                return
            }
            checkCancellation()            
            var src = generateSourceCode()
            await options.onData(src)
        } catch (ex) {
            if (ex.cancelled) {
                reportError("Cancelled by user")
            } else {
                options.onError(ex)
            }
        }
    }

    self.stop = stop
    self.run = run
    return self
}


module.exports = {
    createDrakonTechGenerator
}
},{"./tools":3}],3:[function(require,module,exports){
function findFirst(array, predicate) {
    for (var item of array) {
        if (predicate(item)) {
            return item
        }
    }
    return undefined
}

function addRange(target, source) {
    source.forEach(item => target.push(item))
}

module.exports = {
    findFirst,
    addRange
}
},{}]},{},[1]);

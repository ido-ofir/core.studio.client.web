
module.exports = {
    name: 'core.studio.client.web',
    events: ['update', 'template.hover', 'template.select'],
    init(definition, done){
        
        var core = this;
        var reloading = false;

        function restrictDepth(obj, maxDepth, level){
            if(!obj) return obj;
            if(typeof obj !== 'object') return obj;
            if(!level) level = 1;
            if(level > maxDepth) return `(${typeof obj})`;
            if(Array.isArray(obj)){
                return obj.map(o => restrictDepth(o, maxDepth, level + 1))
            }
            var o = {};
            for(var m in obj){
                o[m] = restrictDepth(obj[m], maxDepth, level + 1);
            }
            return o;
        }

        core.on('core.monitor', function(){
            if(!studioClient.active) return;
            var args = [].slice.call(arguments).map(d => restrictDepth(d, 3));
            studioClient.postMessage({
                action: 'monitor',
                arguments: args
            })
        });

        var studioClient = {
            active: true,
            children: [],
            api: {
                init({ name, child }){
                    var names = Object.keys(core.definitions);
                    var definitions = {};
                    if(child){
                        if(!this.children.length){
                            
                        }
                    }
                    Object.keys(core.definitions).map(key => {
                        var definition = core.definitions[key];
                        definitions[key] = { 
                            name: definition.name,
                            schema: definition.schema,
                            type: definition.type,
                            propTypes: definition.propTypes,
                            body: definition.body,
                            description: definition.description,
                            docs: definition.docs
                        };
                    })
                    studioClient.postMessage({
                        action: 'init',
                        arguments: [{
                            monitor: [],
                            actions: Object.keys(core.actions),
                            components: Object.keys(core.components),
                            templates: Object.keys(core.templates),
                            definitions: definitions
                        }]
                    });
                },
                childClosed(){
                    if(reloading){
                        reloading = false;
                        return;
                    }
                    else{
                        setTimeout(function(){
                            if(studioClient.children[0]){
                                if(!studioClient.children[0].self){
                                    localStorage.removeItem('core.studioClient.childUrl');
                                }
                            }
                        }, 1000)
                    }
                },
                reload(){
                    location.reload();
                },
                emit(eventName, data){
                    core.emit(eventName, data);
                },
                updateByType(type, value){
                    var t = core.types[type];
                    var id = t.identifier && value[t.identifier];
                    if(id){
                        core.emit(`core.${ type }.update.${id}`, value);
                    }
                    core.emit(`core.${ type }.update`, value);
                },
                getDefinition(type, id){
                    
                }
            },
            postMessage(message){  // { ns: 'core.studio.message', action: 'init', arguments: ['1', '2'] }
                var children = studioClient.children || [];
                if(parent !== window){
                    children = [parent].concat(children);
                }
                children.map(win => {
                    var values = [];
                    win.postMessage(
                        JSON.stringify(
                            Object.assign({ ns: 'core.browserWindow.message'}, message),
                            (key, value) => {
                                if(value && (typeof value === 'object')){
                                    if(values.indexOf(value) > -1){
                                        return '[Circular]'
                                    }
                                    values.push(value);
                                }
                                return value;
                            }
                        ),
                    '*')
                });
            },
            open(url, name){
                var width = 800;
                var height = 600;
                studioClient.children.push(window.open(url, name || 'studio', ''));  // `left=${ (screen.width - width) / 2 },top=${ (screen.height - height) / 2 },width=${ width },height=${ height }`
                localStorage.setItem('core.studioClient.childUrl', url);
            },
            close(){
                studioClient.children.map(w => w.close());
                localStorage.removeItem('core.studioClient.childUrl');
            }
        }

        window.addEventListener('message', (message) => {
            
            try{
                message = JSON.parse(message.data);
                if(message && (message.ns === 'core.studio.message')){
                    if(message.action){
                        if(!core.isFunction(studioClient.api[message.action])){
                            return console.warn(`cannot find action '${message.action}'`)
                        }
                        studioClient.api[message.action].apply(studioClient, message.arguments || []);
                    }
                }
            }
            catch(err){  }
            
        }, false);

        var childUrl = localStorage.getItem('core.studioClient.childUrl');
        if(childUrl){
            reloading = true;
            studioClient.open(childUrl);
            // setTimeout(e => studioClient.connect(childUrl), 4000);
        }

        core.studio = studioClient;

        done(studioClient);
    }
};
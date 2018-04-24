(function(){
    class MVVM {
        constructor(options){
            this.data = options.data;
            this.el = document.querySelector(options.el);
            this.observe(this.data);
            this.proxy(this.data);
            this.compile(this.el);
        }
        observe(data){
            Object.keys(data).forEach(key => {
                let val = data[key];
                if(typeof val === 'object'){
                    this.observe(val);
                } else {
                    let dep = new Dep();
                    Object.defineProperty(data, key, {
                        configurable: false,
                        enumerable: true,
                        get(){
                            Dep.watcher && Dep.watcher.addDep(dep);
                            return val;
                        },
                        set(newVal){
                            val = newVal;
                            dep.notify();
                        }
                    })
                }
            })
        }
        proxy(data){
            Object.keys(data).forEach(key => {
                Object.defineProperty(this, key, {
                    configurable: false,
                    enumerable: true,
                    get(){
                        return this.data[key];
                    },
                    set(newVal){
                        this.data[key] = newVal;
                    }
                })
            })
        }
        compile(dom){
            this.fragment = document.createDocumentFragment();
            while((dom.firstChild)){
                this.fragment.appendChild(dom.firstChild);
            }
            this.parse(this.fragment);
            this.el.appendChild(this.fragment);
        }

        parse(root){
            console.log('parse');
            [].slice.call(root.childNodes).forEach(node => {
                switch (node.nodeType) {
                    case Node.ELEMENT_NODE:
                        this.parse(node);
                        break;
                    case Node.TEXT_NODE:
                        if (/{{(.*?)}}/.test(node.textContent)) {
                            textUpdater(node, this.getVal(RegExp.$1));
                            new Watcher(this, RegExp.$1, (newVal) => {
                                textUpdater(node, newVal);
                            });
                        }
                        break;
                    default:
                        break;
                }
            });
        }

        getVal(exp) {
            let val = this.data;
            exp.split('.').forEach(key => {
                val = val[key];
            });
            return val;
        }
    }

    class Watcher {
        constructor(vm, exp, cb){
            this.vm = vm;
            this.cb = cb;
            this.getter = this.findGetter(exp);
            this.val = this.get();
        }

        update(){
            let val = this.get();
            if(val !== this.val){
                this.val = val;
                this.cb.call(this.vm, val);
            }
        }

        addDep(dep){
            dep.addSub(this);
        }

        findGetter(exp){
            let keys = exp.split('.');

            return function(val){
                keys.forEach(key => {
                    val = val[key];
                })
                return val;
            }
        }

        get(){
            Dep.watcher = this;
            let val = this.getter.call(this, this.vm);
            Dep.watcher = null;
            return val;
        }
    }


    class Dep {
        constructor(){
            this.subs = [];
        }

        addSub(sub){
            this.subs.push(sub);
        }
        notify(){
            this.subs.forEach(sub => {
                sub.update();
            })
        }
    }

    function textUpdater(node, newVal){
        node.textContent = newVal;
    }



    window.MVVM = MVVM;
})();
$log("Defining Document");
/*
* Document - DOM Level 2
*  The Document object is not directly 
*/
$w.__defineGetter__('Document', function(){
  return function(){
    throw new Error("Object cannot be created in this context");
  };
});


/**
 * @class  DOMDocument - The Document interface represents the entire HTML or XML document.
 *   Conceptually, it is the root of the document tree, and provides the primary access to the document's data.
 *
 * @extends DOMNode
 * @author Jon van Noort (jon@webarcana.com.au)
 * @param  implementation : DOMImplementation - the creator Implementation
 */
var DOMDocument = function(implementation) {
    //$log("\tcreating dom document");
    this.DOMNode = DOMNode;
    this.DOMNode(this);
    
    this.doctype = null;                  // The Document Type Declaration (see DocumentType) associated with this document
    this.implementation = implementation; // The DOMImplementation object that handles this document.
    this.documentElement = null;          // This is a convenience attribute that allows direct access to the child node that is the root element of the document
    
    this.nodeName  = "#document";
    this._id = 0;
    this._lastId = 0;
    this._parseComplete = false;                   // initially false, set to true by parser
    this._url = "";
    
    this.ownerDocument = null;
    
    this._performingImportNodeOperation = false;
    //$log("\tfinished creating dom document " + this);
};
DOMDocument.prototype = new DOMNode;
__extend__(DOMDocument.prototype, {	
    addEventListener        : function(){ window.addEventListener.apply(this, arguments) },
	removeEventListener     : function(){ window.removeEventListener.apply(this, arguments) },
	attachEvent             : function(){ window.addEventListener.apply(this, arguments) },
	detachEvent             : function(){ window.removeEventListener.apply(this, arguments) },
	dispatchEvent           : function(){ window.dispatchEvent.apply(this, arguments) },

    get styleSheets(){ 
        return [];/*TODO*/ 
    },
    get all(){
        return this.getElementsByTagName("*");
    },
    loadXML : function(xmlStr) {
        // create SAX Parser
        var parser = new XMLP(String(xmlStr));
        
        // create DOM Document
        var doc = new HTMLDocument(this.implementation);
        // populate Document with Parsed Nodes
        try {
            __parseLoop__(this.implementation, doc, parser);
            //doc = html2dom(xmlStr+"", doc);
        	//$log("\nhtml2xml\n" + doc.xml);
        } catch (e) {
            //$error(this.implementation.translateErrCode(e.code))
            $error(e);
        }

        // set parseComplete flag, (Some validation Rules are relaxed if this is false)
        doc._parseComplete = true;
        if(this === $document){
            $log("Setting internal window.document");
            $document = doc;
        }
        return doc;
    },
    load: function(url){
		$log("Loading url into DOM Document: "+ url + " - (Asynch? "+$w.document.async+")");
        var scripts, _this = this;
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, $w.document.async);
        xhr.onreadystatechange = function(){
            try{
        	    _this.loadXML(xhr.responseText);
            }catch(e){
                $error("Error Parsing XML - ",e);
                _this.loadXML(
                "<html><head></head><body>"+
                    "<h1>Parse Error</h1>"+
                    "<p>"+e.toString()+"</p>"+  
                "</body></html>");
            }
            _this._url = url;
            
        	$log("Loading scripts.");
            scripts = document.getElementsByTagName('script');
            /*for(var prop in $policy){
                $log("$policy."+prop+" ="+$policy[prop]);
            }*/
            for(var i=0;i<scripts.length;i++){
                $policy.loadScript(scripts[i]);
            }
        	$log("Sucessfully loaded document.");
        	var event = document.createEvent();
        	event.initEvent("load");
        	$w.dispatchEvent( event );
        };
        xhr.send();
    },
	createEvent             : function(eventType){ 
        var event;
        if(eventType === "UIEvents"){ event = new UIEvent();}
        else if(eventType === "MouseEvents"){ event = new MouseEvent();}
        else{ event = new Event(); } 
        return event;
    },
    createExpression        : function(xpath, nsuriMap){ 
        return null;/*TODO*/
    },
    createElement : function(tagName) {
        //$log("DOMDocument.createElement( "+tagName+" )");
          // throw Exception if the tagName string contains an illegal character
          if (__ownerDocument__(this).implementation.errorChecking && (!__isValidName__(tagName))) {
            throw(new DOMException(DOMException.INVALID_CHARACTER_ERR));
          }
        
          // create DOMElement specifying 'this' as ownerDocument
          var node = new DOMElement(this);
        
          // assign values to properties (and aliases)
          node.tagName  = tagName;
        
          return node;
    },
    createDocumentFragment : function() {
          // create DOMDocumentFragment specifying 'this' as ownerDocument
          var node = new DOMDocumentFragment(this);
        
          return node;
    },
    createTextNode: function(data) {
          // create DOMText specifying 'this' as ownerDocument
          var node = new DOMText(this);
        
          // assign values to properties (and aliases)
          node.data      = data;
        
          return node;
    },
    createComment : function(data) {
          // create DOMComment specifying 'this' as ownerDocument
          var node = new DOMComment(this);
        
          // assign values to properties (and aliases)
          node.data      = data;
        
          return node;
    },
    createCDATASection : function(data) {
          // create DOMCDATASection specifying 'this' as ownerDocument
          var node = new DOMCDATASection(this);
        
          // assign values to properties (and aliases)
          node.data      = data;
        
          return node;
    },
    createProcessingInstruction : function(target, data) {
          // throw Exception if the target string contains an illegal character
        //$log("DOMDocument.createProcessingInstruction( "+target+" )");
          if (__ownerDocument__(this).implementation.errorChecking && (!__isValidName__(target))) {
            throw(new DOMException(DOMException.INVALID_CHARACTER_ERR));
          }
        
          // create DOMProcessingInstruction specifying 'this' as ownerDocument
          var node = new DOMProcessingInstruction(this);
        
          // assign values to properties (and aliases)
          node.target    = target;
          node.data      = data;
        
          return node;
    },
    createAttribute : function(name) {
        // throw Exception if the name string contains an illegal character
        //$log("DOMDocument.createAttribute( "+target+" )");
        if (__ownerDocument__(this).implementation.errorChecking && (!__isValidName__(name))) {
            throw(new DOMException(DOMException.INVALID_CHARACTER_ERR));
        }
        
        // create DOMAttr specifying 'this' as ownerDocument
        var node = new DOMAttr(this);
        
        // assign values to properties (and aliases)
        node.name     = name;
        
        return node;
    },
    createElementNS : function(namespaceURI, qualifiedName) {
        //$log("DOMDocument.createElement( "+namespaceURI+", "+qualifiedName+" )");
          // test for exceptions
          if (__ownerDocument__(this).implementation.errorChecking) {
            // throw Exception if the Namespace is invalid
            if (!__isValidNamespace__(this, namespaceURI, qualifiedName)) {
              throw(new DOMException(DOMException.NAMESPACE_ERR));
            }
        
            // throw Exception if the qualifiedName string contains an illegal character
            if (!__isValidName__(qualifiedName)) {
              throw(new DOMException(DOMException.INVALID_CHARACTER_ERR));
            }
          }
        
          // create DOMElement specifying 'this' as ownerDocument
          var node  = new DOMElement(this);
          var qname = __parseQName__(qualifiedName);
        
          // assign values to properties (and aliases)
          node.namespaceURI = namespaceURI;
          node.prefix       = qname.prefix;
          node.localName    = qname.localName;
          node.tagName      = qualifiedName;
        
          return node;
    },
    createAttributeNS : function(namespaceURI, qualifiedName) {
          // test for exceptions
          if (__ownerDocument__(this).implementation.errorChecking) {
            // throw Exception if the Namespace is invalid
            if (!__isValidNamespace__(this, namespaceURI, qualifiedName, true)) {
              throw(new DOMException(DOMException.NAMESPACE_ERR));
            }
        
            // throw Exception if the qualifiedName string contains an illegal character
            if (!__isValidName__(qualifiedName)) {
              throw(new DOMException(DOMException.INVALID_CHARACTER_ERR));
            }
          }
        
          // create DOMAttr specifying 'this' as ownerDocument
          var node  = new DOMAttr(this);
          var qname = __parseQName__(qualifiedName);
        
          // assign values to properties (and aliases)
          node.namespaceURI = namespaceURI;
          node.prefix       = qname.prefix;
          node.localName    = qname.localName;
          node.name         = qualifiedName;
          node.nodeValue    = "";
        
          return node;
    },
    createNamespace : function(qualifiedName) {
          // create DOMNamespace specifying 'this' as ownerDocument
          var node  = new DOMNamespace(this);
          var qname = __parseQName__(qualifiedName);
        
          // assign values to properties (and aliases)
          node.prefix       = qname.prefix;
          node.localName    = qname.localName;
          node.name         = qualifiedName;
          node.nodeValue    = "";
        
          return node;
    },
    getElementById : function(elementId) {
          var retNode = null,
              node;
          // loop through all Elements in the 'all' collection
          var all = this.all;
          for (var i=0; i < all.length; i++) {
            node = all[i];
            // if id matches & node is alive (ie, connected (in)directly to the documentElement)
            if (node.id == elementId) {
                if((__ownerDocument__(node).documentElement._id == this.documentElement._id)){
                    retNode = node;
                    //$log("Found node with id = " + node.id);
                    break;
                }
            }
          }
          
          //if(retNode == null){$log("Couldn't find id " + elementId);}
          return retNode;
    },
    normalizeDocument: function(){
	    this.documentElement.normalize();
    },
    get nodeType(){
        return DOMNode.DOCUMENT_NODE;
    },
    get xml(){
        //$log("Serializing " + this);
        return this.documentElement.xml;
    },
	toString: function(){ 
	    return "Document" +  (typeof this._url == "string" ? ": " + this._url : ""); 
    },
	get defaultView(){ //TODO: why isnt this just 'return $w;'?
		return { getComputedStyle: function(elem){
			return { getPropertyValue: function(prop){
				prop = prop.replace(/\-(\w)/g,function(m,c){ return c.toUpperCase(); });
				var val = elem.style[prop];
				if ( prop == "opacity" && val == "" ){ val = "1"; }return val;
			}};
		}};
	},
    _genId : function() {
          this._lastId += 1;                             // increment lastId (to generate unique id)
          return this._lastId;
    }
});


var __isValidNamespace__ = function(doc, namespaceURI, qualifiedName, isAttribute) {

      if (doc._performingImportNodeOperation == true) {
        //we're doing an importNode operation (or a cloneNode) - in both cases, there
        //is no need to perform any namespace checking since the nodes have to have been valid
        //to have gotten into the DOM in the first place
        return true;
      }
    
      var valid = true;
      // parse QName
      var qName = __parseQName__(qualifiedName);
    
    
      //only check for namespaces if we're finished parsing
      if (this._parseComplete == true) {
    
        // if the qualifiedName is malformed
        if (qName.localName.indexOf(":") > -1 ){
            valid = false;
        }
    
        if ((valid) && (!isAttribute)) {
            // if the namespaceURI is not null
            if (!namespaceURI) {
            valid = false;
            }
        }
    
        // if the qualifiedName has a prefix
        if ((valid) && (qName.prefix == "")) {
            valid = false;
        }
    
      }
    
      // if the qualifiedName has a prefix that is "xml" and the namespaceURI is
      //  different from "http://www.w3.org/XML/1998/namespace" [Namespaces].
      if ((valid) && (qName.prefix == "xml") && (namespaceURI != "http://www.w3.org/XML/1998/namespace")) {
        valid = false;
      }
    
      return valid;
};

/**
 * @name Pluralchum
 * @version 1.0.0
 * @description Plugin that provides better PluralKit integration, like name and text colours.
 * @author Ash Taylor
 *  
*/



const baseEndpoint = "https://api.pluralkit.me/v2";
const React = BdApi.React;

module.exports = class Pluralchum {

	profileMap = {}
	idMap = {}
	currentRequests = 0
	patches = []
	eula = false // "eula" aka tell people what this shit does
	textColour = true
	
	constructor() {
		
	}

	load() {
		
	}

	stop() {
		for (const unpatch of this.patches) unpatch();
		this.purgeOldCachedContent();
		ZLibrary.Utilities.saveSettings(this.getName(), this.getSettings());
		
		BdApi.Patcher.unpatchAll(this.getName());
		ZLibrary.DOMTools.removeStyle(this.getName());
	}

	purgeOldCachedContent() {
		const expirationTime = (1000 * 60 * 60 * 24 * 30);
		let now = Date.now()
		for (const id of Object.keys(this.profileMap)) {
			if (this.profileMap[id].hasOwnProperty("lastUsed")) {
				let lastUsed = this.profileMap[id].lastUsed;
				
				if (now - lastUsed > expirationTime) 
					delete this.profileMap[id];
			} else {
				this.profileMap[id].lastUsed = now;
			}
		}
	}

	start() {
		if (!global.ZeresPluginLibrary) return window.BdApi.alert("Library Missing",`The library plugin needed for ${this.getName()} is missing.<br /><br /> <a href="https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js" target="_blank">Click here to download the library!</a>`);

		let settings = ZLibrary.Utilities.loadSettings(this.getName(), this.getDefaultSettings());
		console.log("[PLURALCHUM] Loaded settings:");
		console.log(settings);
		this.applySettings(settings);

		if (!this.eula) { 
			BdApi.showConfirmationModal('Heads up!',
				 <div align="center" style={{color: "#eeeeee"}}>This plugin uses the PluralKit API to fetch system and member data. <br /><br />Because of technical limitations, this data is cached on your computer between sessions. None of this data is ever shared, collected or uploaded, but you still ought to know. 
				 
				 <br /><br /><b>You can clear this cache at any time in the plugin settings</b>, and unused cache data is automatically deleted after 30 days.</div>, {
                     confirmText: 'Gotcha',
                     cancelText: 'No thanks',
                     onConfirm: function() {
						this.eula = true;
						ZLibrary.Utilities.saveSettings(this.getName(), this.getSettings());
                     }.bind(this)
				 });
			if (!this.eula) {
				BdApi.Plugins.disable(this.getName());
				return;
			}
		}
		
		if (!this.profileMap) 
			this.profileMap = {}
		if (!this.idMap) 
			this.idMap = {}
		console.log("[PLURALCHUM] Loaded PK data:");
		console.log(this.profileMap);
		console.log("IDMAP:");
		console.log(this.idMap);


		const MessageHeader = BdApi.findModule(m => m?.default?.toString().indexOf("showTimestampOnHover") > -1);
		const MessageContent = BdApi.findModule(m => m.type?.displayName === "MessageContent");

		//Patch message content
		BdApi.Patcher.after("Patcher", MessageContent, "type", function(_, [props], ret) { 
			const channel = ZLibrary.DiscordModules.ChannelStore.getChannel(props.message.channel_id);

			if (!channel || !channel.guild_id) 
				return; //No webhooks here lol
			
			if (this.textColour) { this.callbackIfMemberReady(props, function(member) {
				// Set message text colour
				console.log("PROPS");
				console.log(props);
				console.log("RET");
				console.log(ret);

				//lol
				if (member.color)
					ret.props.style = { color: member.color };
				
			}.bind(this));}

		}.bind(this));


		//Patch message header
		BdApi.Patcher.after(this.getName(), MessageHeader, "default", this.messageHeaderUpdate.bind(this));


		// Force message update on channel changed??? somehow??????? idk i found this code online just accept it
		const Modules = ZLibrary.WebpackModules.getModules(m => ~["ChannelMessage", "InboxMessage"].indexOf(m?.type?.displayName));
        for (const Module of Modules) {
            BdApi.Patcher.after(this.getName(), Module, "type", (_, __, ret) => {
                const tree = ZLibrary.Utilities.findInReactTree(ret, m => m?.childrenHeader);
				if (!tree) return;
				
				const originalType = tree.childrenHeader.type.type;
				tree.childrenHeader.type.type = MessageHeader.default;
				this.patches.push((() => {
					tree.childrenHeader.type.type = originalType;
				}));
            });
        }

	}


	messageHeaderUpdate(_, [props], ret) {
		const tree = ZLibrary.Utilities.getNestedProp(ret, "props.username.props.children");

		if (!Array.isArray(tree)) 
			return;
		this.callbackIfMemberReady(props, function(member) {
			
			if (!(props.message.author.hasOwnProperty("username_real"))) {
				let spanId = props.usernameSpanId;
				props.message.author.username_real = props.message.author.username.slice();
				props.message.author.username = member.name;
			}
			
			tree.length = 0; //loser

			let member_color = member.color;
			let member_tag = member.tag;

			if (!member.color)
				member_color = "#ffffff";
			if (typeof member_tag !== 'string')
				member_tag = ""
			
			tree.push(React.createElement("span",	{
				user: props.message.author,
				type: "member_name",
				style: {
					color: member_color,
					fontWeight: "500"
				}
				}, member.name.toString()));
			
			if (member_tag) {
				tree.push(React.createElement("span",	{
					user: props.message.author, 
					type: "system_tag",
					style: {
						color: "#ffffff",
						fontWeight: "500"
					}
				}, " " + member_tag.toString()));
			}
			// lol
			tree.push(
				<span className= "botTagCozy-3NTBvK botTag-1NoD0B botTagRegular-kpctgU botTag-7aX5WZ rem-3kT9wc">
					<span className="botText-1fD6Qk">PK</span>
				</span>
				);
			
		}.bind(this));				
		
	}


	updateMemberByMsg(msg, hash) {
		this.profileMap[hash] = { status: "REQUESTING" };
		this.httpGetAsync("/messages/" + msg, this.createPKCallback(hash).bind(this));
	}


	httpGetAsync(theUrl, callback) {
		var xmlHttp = new XMLHttpRequest();

		xmlHttp.onreadystatechange = function() { 
			if (xmlHttp.readyState == 4) {
				callback(xmlHttp.responseText, xmlHttp.status);
				this.currentRequests -= 1
			}
		}.bind(this);

		this.currentRequests += 1
		console.log("Sending request with delay ", this.currentRequests * 600);
		setTimeout(function() {
			xmlHttp.open("GET", baseEndpoint + theUrl, true); // true for asynchronous 
			xmlHttp.send(null);
		}.bind(this), this.currentRequests * 600);
	}


	createPKCallback(hash) {
		return function(response, status) {
			if (status == 200) {
				console.log("RESPONSE");
				let data = JSON.parse(response);
				console.log(data.member);

				// Map profile hash to member data...
				this.profileMap[hash] = { 
					name: data.member.name,
					color: "#" + data.member.color,
					tag: data.system.tag,
					id: data.member.id,
					system: data.system.id,
					status: "DONE",
				};

				if (data.member.color === null) {
					if (data.system.color !== null) {
						this.profileMap[hash].color = data.system.color;
					} else {
						this.profileMap[hash].color = "";
					}
				}

				if (data.member.display_name) {
					this.profileMap[hash].name = data.member.display_name;
				}
				
				// ...and map member ID to hash
				this.idMap[data.member.id] = hash;
				
			} else if (status == 404) {
				this.profileMap[hash] = {
					status: "NOT_PK"
				}
			}
			ZLibrary.Utilities.saveSettings(this.getName(), this.getSettings());
		}.bind(this);
	}	


	callbackIfMemberReady(props, callback) {
		if (!(props.hasOwnProperty("message"))) {
			return;
		}

		if (props.message.author.discriminator !== "0000") 
			return;
			
		let message = props.message;

		let username = message.author.username;
		if (message.author.hasOwnProperty("username_real"))
			username = message.author.username_real

		let userHash = this.hashCode(username + message.author.avatar);

		if (this.profileMap[userHash]) {
			if (this.profileMap[userHash].status === "DONE") 
				callback(this.profileMap[userHash]);
			
		} else { 
			console.log("Requesting data for member "+ username + " (" + userHash + ")");
			this.updateMemberByMsg(message.id, userHash);
		}
	}

	hashCode(text) {
		var hash = 0;
		for (var i = 0; i < text.length; i++) {
			var char = text.charCodeAt(i);
			hash = ((hash<<5)-hash)+char;
			hash = hash & hash; // Convert to 32bit integer
		}
		return hash;
	}
	


	getSettingsPanel() {
		let settingsPanel = new ZLibrary.Settings.SettingPanel();

		return settingsPanel.getElement();
	}

	getName() {
		return "Pluralchum";
	}

	getDefaultSettings() {
		return {profileMap: {}, idMap: {}, eula: false};
	}

	getSettings() {
		return {profileMap: this.getFilteredProfileMap(), idMap: this.idMap, eula: this.eula}
	}

	applySettings(settings) {
		this.profileMap = settings.profileMap;
		this.idMap = settings.idMap;
		this.eula = settings.eula;
	}
	
	getFilteredProfileMap() {
		const asArray = Object.entries(this.profileMap);
		const filtered = asArray.filter(([_, profile]) => profile.status === "DONE");
		return Object.fromEntries(filtered);
	}
}
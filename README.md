<p align="center"><img src="https://media.discordapp.net/attachments/846781793834106902/946425651634765824/overkill_logo_final.png"><br><b>(PluralKit integration for BetterDiscord)</b><br><br>- by <a href="https://estrobiologist.carrd.co/">ash taylor</a> -</p>


---

<p align="center">
  <br>
  Hey! Is your head FULL OF PEOPLE? Are you an avid PLURALKIT USER?<br>Does seeing plain white usernames, broken profile popups and <code>BOT</code> tags all day make you want to BREAK THINGS?<br><br>Then <b>PLURALCHUM</b> is the plugin for you!
  <br><br><br>
  - [ <a href="https://github.com/transdisaster/pluralchum/releases/latest">Download</a> - 
  <a href="https://github.com/transdisaster/pluralchum/releases">Changelog</a> - 
  <a href="https://www.twitter.com/estroBiologist">Twitter</a> ] - <br><br>
  <i>(requires <a href="https://rauenzi.github.io/BDPluginLibrary/">Zere's Plugin Library</a>)</i>
  <br><br></p>
  
---
<p align="center">
  <img src="https://media.discordapp.net/attachments/846781793834106902/946425239540207716/introduction.png"><br>
  <br>
  <br>
  PluralKit is great. It helps untold numbers of systems communicate over Discord, providing them with robust tools for self-expression.<br>It's an invaluable resource for plural folk on the internet.<br><br>But as you may have noticed... It looks a bit crap, right?<br>
  <br>
  <img src="https://media.discordapp.net/attachments/846781793834106902/946415379440369704/Discord_fGRPvMptnp.png" width="550" border="10"><br>
  <br>
  These limitations aren't PK's fault. The bot uses <b>webhooks</b> to create proxy messages, which Discord just doesn't give features like custom name colours to. Nothing to do about it, unfortunately.<br>
  <br>
  Except, of course, if you could mod the client. Enter <b>Pluralchum</b>.<br>
  <br> 
  <img src="https://media.discordapp.net/attachments/846781793834106902/946415411396751370/Discord_1cL2ymcL79.png" width="550" border="10"><br>
  <br>
  <b>Pluralchum</b> is a plugin for BetterDiscord that utilizes PluralKit's web API to provide better integration for proxied messages.<br>
  It brings features like coloured member names and system tags, optional text colouring, a special <code>PK</code> badge for proxied messages, and much* more!<br>
  <br>
  <i>*not actually that much right now but i'm working on it okay</i><br>
  <br>
  <img src="https://media.discordapp.net/attachments/846781793834106902/946415411702931496/Discord_TfwbO8uAxv.png" width="550" border="10"><br>
</p>

---
<p align="center">
  <img src="https://media.discordapp.net/attachments/846781793834106902/946431418739863633/limitations.png"><br><i>boowomp sound effect</i><br><br>
  Yeah, it's not perfect. I tried my best, but I am categorically not a web developer. I'm always looking to make it better, and some of these will likely be fixed in due time, but, y'know, be aware of them.<br>
  <br>
  <br>
  <b>- Major limitations as of v1.0 -</b><br>
  <br>
  <br>
  1. <b>Initial data gathering.</b><br> Due to the way the plugin requests data from the API, the first time a member's proxy is displayed, it won't be patched by Pluralchum. Once that member's data is received (usually within a few seconds), subsequent messages will work just fine, and updating existing messages (by hovering over them, for example) will let PC patch them too. This becomes less and less of a problem over time, as the bot builds up a cache of member data, leading to an almost seamless experience. Except, however...<br> 
  <br>
  <br>
  2. <b>Displayname/avatar changes.</b><br>The plugin identifies members by hashing the two, so changing them will lead to the bot having to re-identify the member in question. This usually just leads to a single message not being patched.<br>
  <br>
  <br>
  3. <b>Member colours aren't updated when changed.</b><br>
  PC has no way of knowing when a member's colour changes. It only gets that information when it asks for an update from PK in the first place! As of right now, you can manually correct the colour in the config file (same folder as the plugin), but I want to fix it properly for the next update.<br>
  <br>
  <br>
  4. <b>Member names aren't clickable.</b><br>
  This one was more of a deliberate choice, as to not bite off more than I could chew for 1.0. At some point, I'd love to give member names and avatars special PK profile popouts when clicked. That's <b>The Big One</b>, baby.<br>
  <br>
  <br>
  Beyond that, there are likely to be loads of bugs and small issues I haven't spotted. Please don't hesitate to submit an <a href="https://github.com/transdisaster/pluralchum/issues">issue</a> if something's wrong, and any contributions are greatly appreciated! (I apologize for my code.)
</p>
  
---
 
<p align="center">
  <img src="https://cdn.discordapp.com/attachments/641904081320935435/946453833339523122/reviewns_WHYTE.png">
  <br><br><br>
  <b>"This is great!"</b> <br><i> - The Entire Cast of Homestuck Several Times Over</i><br><br><br>
 <b>"This is gr8!"</b> <br><i> - Oh, You Know</i><br><br><br>
  <b>"this shitty plugin's crashed my discord like 5 times"</b> <br><i>- Satisfied Customer</i><br><br><br>
  <i><b>"I HATE JAVASCRIPT I HATE JAVASCRIPT I HATE JAVASCRIPT I HATE JAVASCRIPT I HATE JAVASCRIPT I HATE JAVASCRIPT I HATE JAVASCRIPT I HATE JAVASCRIPT I HATE JAVASCRIPT I HATE JAVASCRIPT I HATE JAVASCRIPT I HATE JAVASCRIPT I HATE JAVASCRIPT I HATE JAVASCRIPT I HATE JAVASCRIPT I HATE JAVASCRIPT I HATE JAVASCRIPT I HATE JAVASCRIPT I HATE JAVASCRIPT I HATE JAVASCRIPT I HATE JAVASCRIPT"</b></i>
  <br><i>- <a href="https://www.twitter.com/estroBiologist">Unsatisfied Programmer</a></i><br><br><br>
  <b>"this is just like <a href="https://chordioid.com/">chordioid</a>"</b> <br><i>- Unsubtle Plug</i><br><br><br>
  <b>"I've embedded a virus in this code that will cause your computer to explode in thirty seconds. Run."</b><br><i>-Dirk Strider</i><br><br><br><br>
</p>

---
<p align="center">
<i>disclaimer: i made all of these quotes up because i thought it would be mildly funny<br><br>except dirk's that one is real</i><br><br><br>
- alchemized by <a href="https://www.twitter.com/estroBiologist">ash taylor</a> -</p>

import { HebrewCalendar, HDate, flags } from "@hebcal/core";

export interface HaftarahInfo {
  book: string;
  verses: string;
  summary: string;
}

export interface ParashaInfo {
  name: string;
  hebrewName: string;
  book: string;
  verses: string;
  summary: string;
  number: number;
  total: number;
  haftarah: HaftarahInfo;
}

const PARASHA_DATA: Record<string, { hebrew: string; book: string; verses: string; summary: string; number: number; haftarah: HaftarahInfo }> = {
  "Bereshit": { hebrew: "בְּרֵאשִׁית", book: "Bereishit", verses: "1:1–6:8", summary: "God creates the world in six days, then rests. Adam and Eve are placed in the Garden of Eden, eat from the forbidden tree, and are expelled. Cain kills Abel. The genealogy from Adam to Noah is listed.", number: 1, haftarah: { book: "Isaiah", verses: "42:5–43:10", summary: "God, creator of the heavens and earth, declares Israel His servant and witness. Just as He breathed life into Adam, He now calls His people to testify to His uniqueness before the nations." } },
  "Noach": { hebrew: "נֹחַ", book: "Bereishit", verses: "6:9–11:32", summary: "God commands Noah to build an ark to survive a great flood that will destroy the corrupted world. After the flood, God establishes a covenant with Noah, marked by a rainbow. The Tower of Babel is built and destroyed.", number: 2, haftarah: { book: "Isaiah", verses: "54:1–55:5", summary: "God promises to restore Israel with everlasting kindness, comparing His oath never to abandon Israel to His promise to Noah never to flood the earth again. The covenant of peace will not be removed." } },
  "Lech-Lecha": { hebrew: "לֶךְ-לְךָ", book: "Bereishit", verses: "12:1–17:27", summary: "God commands Abram to leave his homeland and go to Canaan, promising to make him a great nation. Abram travels through Canaan and Egypt. God makes a covenant with Abram and changes his name to Abraham.", number: 3, haftarah: { book: "Isaiah", verses: "40:27–41:16", summary: "God encourages His people with the strength He gave Abraham: 'Do not fear, I am with you.' Israel, the seed of Abraham His beloved, will be renewed and will thresh mountains like a new threshing sledge." } },
  "Vayeira": { hebrew: "וַיֵּרָא", book: "Bereishit", verses: "18:1–22:24", summary: "God and angels visit Abraham, promising him a son. Sodom and Gomorrah are destroyed. Isaac is born. Abraham is commanded to sacrifice Isaac but an angel stops him at the last moment.", number: 4, haftarah: { book: "2 Kings", verses: "4:1–37", summary: "The prophet Elisha promises a barren Shunammite woman that she will bear a son — mirroring God's promise to Sarah. When the child later dies, Elisha miraculously restores him to life, paralleling the Akeidah's theme of divine rescue." } },
  "Chayei Sara": { hebrew: "חַיֵּי שָׂרָה", book: "Bereishit", verses: "23:1–25:18", summary: "Sarah dies and Abraham purchases the Cave of Machpelah as her burial place. Abraham sends his servant to find a wife for Isaac; Rebekah is chosen. Abraham remarries and eventually dies.", number: 5, haftarah: { book: "1 Kings", verses: "1:1–31", summary: "The aged King David, like Abraham, makes arrangements for his succession. Bathsheba and Nathan secure the throne for Solomon, paralleling Abraham's careful provision for Isaac's future through his servant's mission." } },
  "Toldot": { hebrew: "תּוֹלְדֹת", book: "Bereishit", verses: "25:19–28:9", summary: "Isaac and Rebekah have twin sons: Esau and Jacob. Esau sells his birthright to Jacob. Jacob deceives his blind father Isaac and receives the blessing meant for Esau.", number: 6, haftarah: { book: "Malachi", verses: "1:1–2:7", summary: "God declares His love for Jacob over Esau. The prophet rebukes priests who offer blemished sacrifices, connecting to Isaac's blessing of his sons and the theme of authentic versus compromised devotion." } },
  "Vayetzei": { hebrew: "וַיֵּצֵא", book: "Bereishit", verses: "28:10–32:3", summary: "Jacob flees to his uncle Laban. He dreams of a ladder to heaven. He works for Laban to marry Rachel and Leah. His twelve sons are born. He eventually flees from Laban.", number: 7, haftarah: { book: "Hosea", verses: "12:13–14:10", summary: "Hosea recalls Jacob's flight to Aram and his service for a wife, connecting the patriarch's perseverance to Israel's call to return to God. The haftarah closes with a moving invitation: 'Return, O Israel, to the Lord your God.'" } },
  "Vayishlach": { hebrew: "וַיִּשְׁלַח", book: "Bereishit", verses: "32:4–36:43", summary: "Jacob wrestles with an angel and is renamed Israel. He is reconciled with Esau. His daughter Dinah is assaulted; her brothers take revenge. Rachel dies giving birth to Benjamin.", number: 8, haftarah: { book: "Hosea", verses: "11:7–12:12", summary: "God speaks of His struggle with Ephraim — mirroring Jacob's wrestling with the angel. The prophet recalls how Jacob strove with God and prevailed through weeping and supplication, urging Israel to return to God's ways." } },
  "Vayeshev": { hebrew: "וַיֵּשֶׁב", book: "Bereishit", verses: "37:1–40:23", summary: "Jacob favors Joseph, who receives a coat of many colors. Joseph's brothers sell him into slavery in Egypt. Joseph serves Potiphar but is imprisoned. He interprets dreams in prison.", number: 9, haftarah: { book: "Amos", verses: "2:6–3:8", summary: "Amos condemns Israel for selling the righteous for silver — a direct echo of Joseph's brothers selling him. God will surely punish those who exploit the innocent; the prophet warns that divine justice is inescapable." } },
  "Miketz": { hebrew: "מִקֵּץ", book: "Bereishit", verses: "41:1–44:17", summary: "Pharaoh has two dreams; Joseph interprets them as seven years of plenty followed by famine. Joseph is appointed viceroy of Egypt. His brothers come to buy grain; Joseph recognizes them but they do not recognize him.", number: 10, haftarah: { book: "1 Kings", verses: "3:15–4:1", summary: "Solomon's famous dream at Gibeon — where he asks for wisdom rather than wealth — parallels Joseph's God-given gift of dream interpretation. Solomon then judges the case of two mothers, demonstrating the wisdom he received." } },
  "Vayigash": { hebrew: "וַיִּגַּשׁ", book: "Bereishit", verses: "44:18–47:27", summary: "Judah pleads for Benjamin's release. Joseph reveals himself to his brothers. Jacob and his family move to Egypt. Joseph provides land in Goshen for his family.", number: 11, haftarah: { book: "Ezekiel", verses: "37:15–28", summary: "Ezekiel joins two sticks — one for Judah, one for Joseph — into one, prophesying the future reunification of the divided kingdom. Just as Joseph reunited his fractured family, God will reunite all Israel under one shepherd." } },
  "Vayechi": { hebrew: "וַיְחִי", book: "Bereishit", verses: "47:28–50:26", summary: "Jacob blesses his sons and grandchildren before dying. Joseph promises to bury Jacob in Canaan. Jacob is buried with great ceremony. Joseph forgives his brothers and dies in Egypt.", number: 12, haftarah: { book: "1 Kings", verses: "2:1–12", summary: "The dying King David, like Jacob, gathers his son Solomon and gives him final instructions — urging him to walk in God's ways. David's death and Solomon's succession mirror Jacob's deathbed blessings and Joseph's faithful carrying out of his father's wishes." } },
  "Shemot": { hebrew: "שְׁמוֹת", book: "Shemot", verses: "1:1–6:1", summary: "The Israelites are enslaved in Egypt. Moses is born, placed in a basket on the Nile, and raised in Pharaoh's palace. God appears to Moses in a burning bush and commands him to lead the Israelites out of Egypt.", number: 13, haftarah: { book: "Isaiah", verses: "27:6–28:13, 29:22–23", summary: "Isaiah prophesies that Jacob will blossom and fill the world with fruit — a reversal of the Egyptian oppression. God promises to redeem His children, and they will no longer be ashamed but will hallow His name." } },
  "Vaeira": { hebrew: "וָאֵרָא", book: "Shemot", verses: "6:2–9:35", summary: "God tells Moses and Aaron to go to Pharaoh. The first seven plagues—blood, frogs, lice, wild animals, pestilence, boils, and hail—strike Egypt. Pharaoh repeatedly refuses to free the Israelites.", number: 14, haftarah: { book: "Ezekiel", verses: "28:25–29:21", summary: "God promises to restore Israel to their land and to punish Egypt, comparing Pharaoh to a great dragon lying in the Nile. Just as the plagues humiliated Egypt, God will again make Egypt desolate as a sign of His sovereignty." } },
  "Bo": { hebrew: "בֹּא", book: "Shemot", verses: "10:1–13:16", summary: "The final three plagues—locusts, darkness, and death of the firstborn—strike Egypt. God commands the Passover sacrifice. Pharaoh finally lets the Israelites go; they leave Egypt in haste.", number: 15, haftarah: { book: "Jeremiah", verses: "46:13–28", summary: "Jeremiah prophesies that Babylon will sweep into Egypt like a swarm of locusts, echoing the plague of locusts in the Torah portion. Yet God promises to save Israel from their enemies: 'Fear not, My servant Jacob, for I am with you.'" } },
  "Beshalach": { hebrew: "בְּשַׁלַּח", book: "Shemot", verses: "13:17–17:16", summary: "Pharaoh changes his mind and pursues the Israelites. God splits the Red Sea; the Israelites cross safely while the Egyptian army drowns. Moses and Miriam sing songs of praise. The manna begins.", number: 16, haftarah: { book: "Judges", verses: "4:4–5:31", summary: "The prophetess Deborah leads Israel to a miraculous military victory over Sisera. Deborah's song of triumph — one of the Torah's great victory poems — directly parallels the Song of the Sea that Moses and Miriam sang at the Red Sea." } },
  "Yitro": { hebrew: "יִתְרוֹ", book: "Shemot", verses: "18:1–20:23", summary: "Moses's father-in-law Jethro visits and advises on governance. God reveals the Torah at Mount Sinai. The Ten Commandments are given amid thunder, lightning, and a shofar blast.", number: 17, haftarah: { book: "Isaiah", verses: "6:1–7:6, 9:5–6", summary: "Isaiah's vision of the heavenly throne room — with seraphim crying 'Holy, holy, holy' — mirrors the revelation at Sinai. Just as Israel experienced the divine presence at the mountain, Isaiah encounters God's glory and is commissioned as a prophet." } },
  "Mishpatim": { hebrew: "מִּשְׁפָּטִים", book: "Shemot", verses: "21:1–24:18", summary: "God gives Moses a large body of civil and religious law including rules about slavery, personal injury, property, and moral behavior. The people accept the Torah. Moses ascends Sinai for 40 days.", number: 18, haftarah: { book: "Jeremiah", verses: "34:8–22, 33:25–26", summary: "King Zedekiah's people freed their slaves but then re-enslaved them — violating the covenant laws of Mishpatim. Jeremiah condemns this hypocrisy, connecting civil law to covenantal faithfulness and warning of severe consequences." } },
  "Terumah": { hebrew: "תְּרוּמָה", book: "Shemot", verses: "25:1–27:19", summary: "God instructs Moses on building the Tabernacle and its furnishings—the ark, table, menorah, and altar—using donations from the people. Detailed measurements and materials are specified.", number: 19, haftarah: { book: "1 Kings", verses: "5:26–6:13", summary: "Solomon builds the Temple in Jerusalem — the permanent successor to the Tabernacle. The description of the Temple's cedars, chambers, and holy inner sanctum echoes and fulfills the Tabernacle instructions God gave to Moses in the wilderness." } },
  "Tetzaveh": { hebrew: "תְּצַוֶּה", book: "Shemot", verses: "27:20–30:10", summary: "God gives instructions for the menorah oil and the priestly garments—the ephod, breastplate, robe, tunic, and turban. The ordination ceremony for Aaron and his sons is described.", number: 20, haftarah: { book: "Ezekiel", verses: "43:10–27", summary: "Ezekiel describes the future Temple's altar and the priestly service that will be restored — paralleling the Tabernacle's altar and Aaron's ordination. The prophet emphasizes that the priests must be of pure lineage, connecting to Tetzaveh's priestly garments." } },
  "Ki Tisa": { hebrew: "כִּי תִשָּׂא", book: "Shemot", verses: "30:11–34:35", summary: "Moses takes a census. While Moses receives the Torah on Sinai, the people build the Golden Calf. Moses breaks the tablets, destroys the calf, and pleads for the people. New tablets are made.", number: 21, haftarah: { book: "1 Kings", verses: "18:1–39", summary: "Elijah confronts the 450 prophets of Baal on Mount Carmel — mirroring Moses's confrontation with Israel's idolatry. The people ultimately cry 'The Lord is God!' just as Moses fought to restore Israel's exclusive loyalty to God after the Golden Calf." } },
  "Vayakhel": { hebrew: "וַיַּקְהֵל", book: "Shemot", verses: "35:1–38:20", summary: "Moses assembles the people and repeats the Shabbat commandment. Gifts are collected for the Tabernacle. Bezalel and Oholiab lead the construction of the Tabernacle and its furnishings.", number: 22, haftarah: { book: "1 Kings", verses: "7:40–50", summary: "Hiram the craftsman completes all the vessels and furnishings for Solomon's Temple — the golden lampstands, tables, and implements — directly paralleling Bezalel's skilled craftsmanship of the Tabernacle's sacred objects." } },
  "Pekudei": { hebrew: "פְקוּדֵי", book: "Shemot", verses: "38:21–40:38", summary: "An accounting of the materials used for the Tabernacle is given. The completed Tabernacle is assembled and dedicated. God's presence fills the Tabernacle; a cloud guides the Israelites on their journeys.", number: 23, haftarah: { book: "1 Kings", verses: "7:51–8:21", summary: "Solomon completes the Temple and the priests bring the Ark into the Holy of Holies. A cloud fills the Temple — just as the cloud of God's presence filled the completed Tabernacle. Solomon proclaims that God has fulfilled His promise to David." } },
  "Vayikra": { hebrew: "וַיִּקְרָא", book: "Vayikra", verses: "1:1–5:26", summary: "God calls to Moses from the Tent of Meeting and begins teaching the laws of sacrifices—burnt offerings, grain offerings, peace offerings, sin offerings, and guilt offerings.", number: 24, haftarah: { book: "Isaiah", verses: "43:21–44:23", summary: "God tells Israel He no longer requires their sacrifices as they have burdened Him with sins. He will blot out their transgressions for His own sake. The passage concludes with a call to return: God has formed Israel for Himself." } },
  "Tzav": { hebrew: "צַו", book: "Vayikra", verses: "6:1–8:36", summary: "Further instructions about sacrifices are given to Aaron and the priests. The seven-day ordination ceremony for Aaron and his sons is described and carried out.", number: 25, haftarah: { book: "Jeremiah", verses: "7:21–8:3, 9:22–23", summary: "Jeremiah declares that God did not command sacrifices when He brought Israel from Egypt — what He wanted was obedience. The prophet warns against vain ritual divorced from ethical living, calling Israel to truly know and understand God." } },
  "Shemini": { hebrew: "שְּׁמִינִי", book: "Vayikra", verses: "9:1–11:47", summary: "On the eighth day of the ordination, Aaron offers sacrifices and God's fire consumes the offerings. Aaron's sons Nadab and Abihu offer strange fire and die. The dietary laws (kashrut) are given.", number: 26, haftarah: { book: "2 Samuel", verses: "6:1–7:17", summary: "David brings the Ark to Jerusalem with great celebration, but Uzzah touches the Ark and dies — paralleling Nadab and Abihu's unauthorized approach to God. The haftarah includes God's promise to build David a house, contrasting human presumption with divine covenant." } },
  "Tazria": { hebrew: "תַזְרִיעַ", book: "Vayikra", verses: "12:1–13:59", summary: "Laws of purity after childbirth are given. Detailed laws of tzara'at (a skin condition), including diagnosis by a priest and isolation procedures, are described.", number: 27, haftarah: { book: "2 Kings", verses: "4:42–5:19", summary: "Naaman, a Syrian general afflicted with tzara'at, is healed by immersing in the Jordan River at Elisha's command. The miracle of healing the leper-like affliction directly parallels the Torah's purification laws for tzara'at." } },
  "Metzora": { hebrew: "מְּצֹרָע", book: "Vayikra", verses: "14:1–15:33", summary: "Purification rituals for a person healed of tzara'at are described. Laws about tzara'at in clothing and houses follow. Laws of ritual impurity from bodily discharges are given.", number: 28, haftarah: { book: "2 Kings", verses: "7:3–20", summary: "Four men afflicted with tzara'at discover that the besieging Aramean army has fled and bring the lifesaving news to Samaria. The metzora'im, outcasts from society, become the instruments of national salvation — a profound lesson about those on the margins." } },
  "Achrei Mot": { hebrew: "אַחֲרֵי מוֹת", book: "Vayikra", verses: "16:1–18:30", summary: "After the deaths of Aaron's sons, God gives Aaron instructions for the Yom Kippur service, including the two goats and the scapegoat. Laws prohibiting certain sexual relationships are given.", number: 29, haftarah: { book: "Ezekiel", verses: "22:1–19", summary: "Ezekiel lists Jerusalem's sins — bloodshed, idolatry, and sexual immorality — mirroring the prohibited relationships in the Torah portion. The prophet warns that such impurity will lead to exile, just as the Torah warned that the land will vomit out its inhabitants." } },
  "Kedoshim": { hebrew: "קְדֹשִׁים", book: "Vayikra", verses: "19:1–20:27", summary: "God commands Israel to be holy. A wide range of ethical, ritual, and social laws follow, including love your neighbor as yourself, honoring parents, and prohibitions on various immoral behaviors.", number: 30, haftarah: { book: "Amos", verses: "9:7–15", summary: "Amos concludes his prophecy with a vision of restoration: God will rebuild the fallen booth of David and replant Israel in their land. The promise of an abundant, peaceful homeland answers Kedoshim's call to live holy lives worthy of the Promised Land." } },
  "Emor": { hebrew: "אֱמֹר", book: "Vayikra", verses: "21:1–24:23", summary: "Laws of priestly purity and conduct are given. The Jewish calendar and its holidays are described. Laws about the menorah and showbread follow. The blasphemer is stoned.", number: 31, haftarah: { book: "Ezekiel", verses: "44:15–31", summary: "Ezekiel describes the priests of the future Temple — the sons of Zadok who will serve faithfully. The requirements for priestly conduct, mourning restrictions, and forbidden foods directly parallel the priestly laws detailed in Emor." } },
  "Behar": { hebrew: "בְּהַר", book: "Vayikra", verses: "25:1–26:2", summary: "Laws of the Sabbatical year (shemitah) and Jubilee year (yovel) are given. Laws about redeeming property and freeing slaves in the Jubilee year follow.", number: 32, haftarah: { book: "Jeremiah", verses: "32:6–27", summary: "At the moment Jerusalem is about to fall, Jeremiah buys a field from his cousin — a profound act of faith in future redemption. 'Houses and fields and vineyards shall again be bought in this land.' The act mirrors Behar's laws of redeeming ancestral land." } },
  "Bechukotai": { hebrew: "בְּחֻקֹּתַי", book: "Vayikra", verses: "26:3–27:34", summary: "God promises blessings for following His commandments and severe punishments (the tochecha) for disobedience. Laws of vows and dedications to the Tabernacle conclude the book.", number: 33, haftarah: { book: "Jeremiah", verses: "16:19–17:14", summary: "Jeremiah contrasts the person who trusts in human strength with the one who trusts in God — like a tree by the water, unafraid in a year of drought. This mirrors Bechukotai's promise of blessing for obedience and the curse for abandoning God." } },
  "Bamidbar": { hebrew: "בְּמִדְבַּר", book: "Bamidbar", verses: "1:1–4:20", summary: "God commands a census of the Israelites. The tribes are counted and arranged around the Tabernacle. The Levites are set apart to serve the Tabernacle.", number: 34, haftarah: { book: "Hosea", verses: "2:1–22", summary: "God speaks of wooing Israel back to the wilderness to renew their covenant — echoing Israel's census and formation in the desert. 'I will betroth you to me forever,' God declares, promising a new intimacy that reverses the failures of the desert generation." } },
  "Nasso": { hebrew: "נָשֹׂא", book: "Bamidbar", verses: "4:21–7:89", summary: "The Levite families' duties are assigned. The sotah ritual for a suspected unfaithful wife and the Nazirite vow are described. The Priestly Blessing is given. The tribal leaders bring offerings.", number: 35, haftarah: { book: "Judges", verses: "13:2–25", summary: "An angel announces to the wife of Manoah that she will bear a son — Samson — who will be a Nazirite from birth. The haftarah directly parallels the Torah's Nazirite laws, with Samson's mother forbidden to drink wine just as the Nazirite is." } },
  "Beha'alotcha": { hebrew: "בְּהַעֲלֹתְךָ", book: "Bamidbar", verses: "8:1–12:16", summary: "Instructions for the menorah lighting and Levite purification. The second Passover is instituted. The people complain about the manna; quail are sent. Miriam and Aaron speak against Moses.", number: 36, haftarah: { book: "Zechariah", verses: "2:14–4:7", summary: "Zechariah's vision of the seven-branched golden menorah supplied by two olive trees directly echoes the Tabernacle's menorah. The angel declares: 'Not by might, nor by power, but by My spirit.' The lamp of God burns eternally through divine sustenance." } },
  "Shelach": { hebrew: "שְׁלַח", book: "Bamidbar", verses: "13:1–15:41", summary: "Moses sends twelve spies to scout Canaan. Ten return with a discouraging report; the people despair. God decrees the generation will die in the desert. Caleb and Joshua alone will enter the land.", number: 37, haftarah: { book: "Joshua", verses: "2:1–24", summary: "Joshua sends two spies into Jericho before the conquest — directly echoing Moses's sending of twelve. Rahab hides the spies and receives a promise of safety. Unlike the faithless spies of Shelach, these spies return with confidence: 'God has given us the land.'" } },
  "Korach": { hebrew: "קֹרַח", book: "Bamidbar", verses: "16:1–18:32", summary: "Korach and 250 followers rebel against Moses and Aaron. God causes the earth to swallow Korach's faction and fire consumes the 250. A plague follows; Aaron's staff miraculously blooms.", number: 38, haftarah: { book: "1 Samuel", verses: "11:14–12:22", summary: "Samuel gathers Israel at Gilgal and delivers a final address defending his leadership — just as Moses defended his own against Korach's challenge. Samuel calls on God to send thunder and rain to demonstrate divine judgment on those who reject legitimate leadership." } },
  "Chukat": { hebrew: "חֻקַּת", book: "Bamidbar", verses: "19:1–22:1", summary: "The laws of the red heifer for purification from contact with the dead. Miriam dies. Moses strikes the rock instead of speaking to it and is forbidden from entering Canaan. Aaron dies.", number: 39, haftarah: { book: "Judges", verses: "11:1–33", summary: "Jephthah negotiates with the Ammonite king over the same territories Israel passed through in Chukat, defending Israel's historical right to the land. The echo of Israel's wilderness journeys and confrontations with surrounding nations is direct and intentional." } },
  "Balak": { hebrew: "בָּלָק", book: "Bamidbar", verses: "22:2–25:9", summary: "Balak, king of Moab, hires Balaam to curse Israel. God causes Balaam's donkey to speak. Balaam can only bless Israel instead of curse them. The people sin with the daughters of Moab.", number: 40, haftarah: { book: "Micah", verses: "5:6–6:8", summary: "Micah recalls how God foiled Balak's plan to curse Israel, turning it to blessing. The prophet ends with the Torah's most famous ethical summation: 'Do justice, love kindness, and walk humbly with your God' — the lesson Balaam failed to teach." } },
  "Pinchas": { hebrew: "פִּינְחָס", book: "Bamidbar", verses: "25:10–30:1", summary: "Pinchas receives a covenant of peace for stopping the plague. A new census is taken. The daughters of Zelophehad petition for inheritance rights. Moses is told to transfer leadership to Joshua.", number: 41, haftarah: { book: "1 Kings", verses: "18:46–19:21", summary: "Elijah, zealous for God like Pinchas, flees from Jezebel into the wilderness. God appears to him — not in wind or fire but in a still small voice — and commissions him to anoint new leaders, paralleling Moses's transfer of leadership to Joshua." } },
  "Matot": { hebrew: "מַּטּוֹת", book: "Bamidbar", verses: "30:2–32:42", summary: "Laws of vows and oaths are given. Israel wages war against Midian. The tribes of Reuben and Gad request to settle east of the Jordan; Moses agrees on condition they fight with Israel first.", number: 42, haftarah: { book: "Jeremiah", verses: "1:1–2:3", summary: "God's opening words to Jeremiah — calling him from the womb to be a prophet — are words of commission and promise. Just as Israel was set apart to wage God's battles, Jeremiah is appointed to root out and to plant nations, echoing the theme of covenantal obligation." } },
  "Masei": { hebrew: "מַסְעֵי", book: "Bamidbar", verses: "33:1–36:13", summary: "The forty-two journeys of Israel in the desert are listed. Boundaries of the Land of Israel are given. Cities of refuge for accidental killers are designated. Laws of inheritance finalize the book.", number: 43, haftarah: { book: "Jeremiah", verses: "2:4–28, 3:4", summary: "God asks Israel: 'What did your fathers find wrong with me that they distanced themselves?' The prophet traces the wilderness journeys and how Israel abandoned God despite His faithfulness — a spiritual parallel to the Torah's listing of Israel's physical journeys through the desert." } },
  "Devarim": { hebrew: "דְּבָרִים", book: "Devarim", verses: "1:1–3:22", summary: "Moses begins his farewell address, recounting Israel's journey from Sinai through the desert. He reviews the appointment of judges and the sending of the twelve spies.", number: 44, haftarah: { book: "Isaiah", verses: "1:1–27", summary: "Isaiah's opening vision — a sweeping indictment of corrupt Judah — is read on the Shabbat before Tisha B'Av. 'Hear, O heavens, and listen, O earth' echoes Moses's opening of Devarim. The prophet calls Judah back from injustice to justice." } },
  "Vaetchanan": { hebrew: "וָאֶתְחַנַּן", book: "Devarim", verses: "3:23–7:11", summary: "Moses pleads with God to enter Canaan but is refused. He urges Israel to keep the commandments. The Ten Commandments are repeated. The Shema is proclaimed. Moses urges the people to love God.", number: 45, haftarah: { book: "Isaiah", verses: "40:1–26", summary: "'Comfort, comfort My people' — the famous opening of the Seven Weeks of Consolation. Read on the Shabbat after Tisha B'Av, Isaiah's words of divine comfort answer Moses's pleading in Vaetchanan: God will restore and console His people." } },
  "Eikev": { hebrew: "עֵקֶב", book: "Devarim", verses: "7:12–11:25", summary: "Moses promises blessings for following God's commandments. He warns against forgetting God after entering the prosperous land. He recounts the sin of the Golden Calf and the new tablets.", number: 46, haftarah: { book: "Isaiah", verses: "49:14–51:3", summary: "Zion laments that God has forgotten her; God responds that He cannot forget Israel 'as a mother cannot forget the child of her womb.' This consolation echoes Moses's warning not to forget God — but here it is God declaring He will never forget Israel." } },
  "Re'eh": { hebrew: "רְאֵה", book: "Devarim", verses: "11:26–16:17", summary: "Moses presents a blessing and a curse based on obedience. Laws about the chosen place of worship, false prophets, dietary laws, tithes, the Sabbatical year, and the three pilgrimage festivals.", number: 47, haftarah: { book: "Isaiah", verses: "54:11–55:5", summary: "God promises to rebuild Jerusalem with sapphires and precious stones. He then declares: 'Come, buy wine and milk without money and without cost.' The abundance promised for obedience in Re'eh finds its ultimate prophetic fulfillment in Isaiah's vision of restoration." } },
  "Shoftim": { hebrew: "שֹׁפְטִים", book: "Devarim", verses: "16:18–21:9", summary: "Laws for judges, kings, Levites, and prophets are given. Cities of refuge are described. Rules of warfare, including exemptions and prohibited practices. The unsolved murder ritual.", number: 48, haftarah: { book: "Isaiah", verses: "51:12–52:12", summary: "Isaiah proclaims that God Himself is Israel's judge, redeemer, and comforter. 'Awake, awake, O Zion!' The consolation message challenges Israel's fear of oppressors — just as Shoftim legislates how Israel is to maintain justice and courage in facing enemies." } },
  "Ki Teitzei": { hebrew: "כִּי-תֵצֵא", book: "Devarim", verses: "21:10–25:19", summary: "The largest single concentration of mitzvot: laws covering family, property, sexual ethics, the treatment of others, business practices, and many more. 'Do not forget what Amalek did.'", number: 49, haftarah: { book: "Isaiah", verses: "54:1–10", summary: "God speaks to Israel as a husband to a wife who was briefly abandoned but will be gathered with great mercy. 'For the mountains may depart but My kindness shall not depart.' This unconditional love answers Ki Teitzei's extensive laws regulating human relationships." } },
  "Ki Tavo": { hebrew: "כִּי-תָבוֹא", book: "Devarim", verses: "26:1–29:8", summary: "Laws of first fruits and tithes. The covenant renewal ceremony at Mounts Gerizim and Ebal. The lengthy tochecha—blessings for obedience and terrible curses for disobedience.", number: 50, haftarah: { book: "Isaiah", verses: "60:1–22", summary: "'Arise, shine, for your light has come!' Isaiah's vision of Jerusalem's radiant future reverses the darkness of Ki Tavo's curses. Nations will stream to Israel's light; her gates will be open always. The ultimate blessing answers the covenant's ultimate warning." } },
  "Nitzavim": { hebrew: "נִצָּבִים", book: "Devarim", verses: "29:9–30:20", summary: "Moses gathers all Israel for a covenant renewal. He assures them that repentance is always possible. The commandment is not in heaven but in our mouths and hearts. Choose life.", number: 51, haftarah: { book: "Isaiah", verses: "61:10–63:9", summary: "Isaiah sings of God clothing Israel in garments of salvation — a joyous song answering Nitzavim's covenantal 'choose life.' God will remember His love for Israel and all Israel's afflictions. 'In all their troubles He was troubled, and the angel of His presence saved them.'" } },
  "Vayeilech": { hebrew: "וַיֵּלֶךְ", book: "Devarim", verses: "31:1–31:30", summary: "Moses announces he is 120 years old and will not cross the Jordan. He transfers leadership to Joshua. He writes the Torah and commands it be read every seven years at Sukkot.", number: 52, haftarah: { book: "Isaiah", verses: "55:6–56:8", summary: "'Seek God while He may be found; call upon Him while He is near.' Isaiah's call to return mirrors Moses's final exhortation in Vayeilech. God promises that even foreigners and strangers who hold fast to His covenant will be brought to His holy mountain." } },
  "Ha'azinu": { hebrew: "הַאֲזִינוּ", book: "Devarim", verses: "32:1–32:52", summary: "Moses recites a poetic song reviewing Israel's history and God's relationship with the people—their rebellion, punishment, and eventual redemption. God tells Moses to ascend Mount Nebo to see Canaan.", number: 53, haftarah: { book: "2 Samuel", verses: "22:1–51", summary: "David's great song of thanksgiving — a poetic masterpiece parallel to Moses's Song of Ha'azinu in every way. Both are songs of a leader at the end of a life of faithful service, praising God who is their Rock, their shield, and their salvation." } },
  "Vezot Haberakhah": { hebrew: "וְזֹאת הַבְּרָכָה", book: "Devarim", verses: "33:1–34:12", summary: "Moses blesses each of the twelve tribes individually. Then Moses ascends Mount Nebo and dies, looking over the Promised Land. The Torah closes with praise for Moses, the greatest prophet.", number: 54, haftarah: { book: "Joshua", verses: "1:1–18", summary: "Immediately after Moses's death, God commissions Joshua: 'Be strong and courageous.' Joshua rallies the tribes and they affirm their loyalty. The haftarah begins where the Torah ends — Moses passing the mantle to Joshua as the Jewish people stand on the threshold of their inheritance." } },
};

const HEBCAL_ALIAS: Record<string, string> = {
  "Sh'lach": "Shelach",
  "Beha'alotcha": "Beha'alotcha",
  "Ha'azinu": "Ha'azinu",
  "Vayera": "Vayeira",
  "Re'eh": "Re'eh",
  "Nitzavim-Vayeilech": "Nitzavim",
  "Matot-Masei": "Matot",
  "Tazria-Metzora": "Tazria",
  "Achrei Mot-Kedoshim": "Achrei Mot",
  "Behar-Bechukotai": "Behar",
  "Vayakhel-Pekudei": "Vayakhel",
  "Chukat-Balak": "Chukat",
};

function resolveParashaName(raw: string): { key: string; displayName: string } | null {
  const clean = raw.replace(/^Parashat\s+/, "").replace(/^Parasha\s+/, "").trim();
  if (PARASHA_DATA[clean]) return { key: clean, displayName: clean };
  if (HEBCAL_ALIAS[clean]) return { key: HEBCAL_ALIAS[clean], displayName: clean };
  for (const key of Object.keys(PARASHA_DATA)) {
    if (key.toLowerCase() === clean.toLowerCase()) return { key, displayName: key };
  }
  return null;
}

export function getCurrentParashaInfo(date: Date = new Date()): ParashaInfo | null {
  try {
    const events = HebrewCalendar.calendar({
      start: date,
      end: new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000),
      il: true,
      isHebrewYear: false,
      sedrot: true,
      mask: flags.PARSHA_HASHAVUA,
    });

    for (const ev of events) {
      const raw = (ev as any).basename ? (ev as any).basename() : ev.render("en");
      const resolved = resolveParashaName(raw);
      if (!resolved) continue;
      const data = PARASHA_DATA[resolved.key];
      if (!data) continue;
      return {
        name: resolved.displayName,
        hebrewName: data.hebrew,
        book: data.book,
        verses: data.verses,
        summary: data.summary,
        number: data.number,
        total: 54,
        haftarah: data.haftarah,
      };
    }
  } catch (e) {
    console.error("Error getting parasha:", e);
  }
  return null;
}

export function getUpcomingParashiyot(date: Date = new Date(), count = 5): Array<{ name: string; date: Date; hebrewName: string }> {
  try {
    const endDate = new Date(date.getTime() + count * 7 * 24 * 60 * 60 * 1000);
    const events = HebrewCalendar.calendar({
      start: date,
      end: endDate,
      il: true,
      isHebrewYear: false,
      sedrot: true,
      mask: flags.PARSHA_HASHAVUA,
    });

    return events.slice(0, count).map(ev => {
      const raw = (ev as any).basename ? (ev as any).basename() : ev.render("en");
      const resolved = resolveParashaName(raw);
      const data = resolved ? PARASHA_DATA[resolved.key] : undefined;
      return {
        name: resolved?.displayName ?? raw,
        date: ev.getDate().greg(),
        hebrewName: data?.hebrew ?? "",
      };
    });
  } catch {
    return [];
  }
}

export function getUpcomingHolidaysFromParasha(date: Date = new Date(), count = 5): Array<{ name: string; date: Date }> {
  try {
    const endDate = new Date(date.getTime() + 120 * 24 * 60 * 60 * 1000);
    const events = HebrewCalendar.calendar({
      start: date,
      end: endDate,
      il: true,
      isHebrewYear: false,
      mask:
        flags.CHAG |
        flags.ROSH_CHODESH |
        flags.MODERN_HOLIDAY |
        flags.MINOR_FAST |
        flags.MAJOR_FAST |
        flags.MINOR_HOLIDAY,
    });
    return events.slice(0, count).map(ev => ({
      name: ev.render("en"),
      date: ev.getDate().greg(),
    }));
  } catch {
    return [];
  }
}

export { PARASHA_DATA };

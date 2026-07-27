export interface HolidayStaticInsight {
  hebrewName: string;
  emoji: string;
  category: "major" | "fast" | "minor" | "rosh_chodesh" | "modern" | "shabbat_special";
  overview: string;
  observances: string;
  mussarLesson: string;
  spiritualTheme: string;
  bneiManasheConnection: string;
  hebrewQuote: { text: string; translation: string; source: string };
}

const INSIGHTS: Record<string, HolidayStaticInsight> = {
  "Rosh Hashana": {
    hebrewName: "רֹאשׁ הַשָּׁנָה",
    emoji: "🍎",
    category: "major",
    overview: "Rosh Hashana, the Jewish New Year, is observed on the 1st and 2nd of Tishrei. It marks the anniversary of Creation and the day on which God judges all humanity. The central ritual is the blowing of the shofar, a ram's horn, which awakens the soul to self-examination.",
    observances: "We abstain from work, attend synagogue for extended prayers including the Musaf Amidah and Unetaneh Tokef, hear 100 shofar blasts, eat symbolic foods (apple in honey, pomegranate), and cast sins into water in the Tashlich ceremony.",
    mussarLesson: "Rosh Hashana demands the middah of Emet — Truth. The Mussar master Rav Yisrael Salanter taught that on this day we must stand before the Divine Court and practice the hardest form of honesty: seeing ourselves as we truly are, neither inflated nor diminished. The shofar cry is the soul's unguarded voice, stripped of self-deception. Ramchal in Mesilat Yesharim teaches that authentic self-examination — cheshbon ha-nefesh, the accounting of the soul — is the foundation of all spiritual growth. On Rosh Hashana, God judges not who we wish we were, but who we have chosen to become through our daily actions.",
    spiritualTheme: "The sovereignty of God (Malchuyot), Divine memory (Zichronot), and the call of revelation (Shofarot) — these three themes invite us to crown God as King of our inner world. True kingship begins when we dethrone our ego and acknowledge a higher authority.",
    bneiManasheConnection: "For the Bnei Menashe, Rosh Hashana carries the weight of generations of longing. After centuries of exile, hearing the shofar in the Land of Israel is itself a fulfillment of prophecy — the sound that gathers the scattered. Each blast is a declaration: we have returned, we remember, and we stand before the King.",
    hebrewQuote: { text: "תִּקְעוּ בַחֹדֶשׁ שׁוֹפָר", translation: "Blow the shofar at the new moon", source: "Tehillim 81:4" },
  },

  "Yom Kippur": {
    hebrewName: "יוֹם כִּפּוּר",
    emoji: "🤍",
    category: "major",
    overview: "Yom Kippur, the Day of Atonement, is the holiest day of the Jewish year, observed on the 10th of Tishrei. It is the culmination of the Ten Days of Repentance and the final seal of the Divine judgment opened on Rosh Hashana.",
    observances: "We fast for 25 hours, abstaining from food, water, bathing, leather shoes, anointing, and marital relations. We spend the day in five prayer services, recite the Vidui (confession) repeatedly, and the High Priest's Temple service is recalled in the Avodah prayer. The day ends with the final Ne'ilah service and a single shofar blast.",
    mussarLesson: "Yom Kippur develops the middah of Anavah — Humility. The Vilna Gaon taught that the entire day is a simulation of death: we wear white like burial shrouds, we fast like the ministering angels, we confess as if we have nothing left to hide. Rav Salanter emphasized that true teshuvah is not guilt but transformation — the actual rewiring of habit and character. The Chofetz Chaim added that Yom Kippur only atones for sins between us and God; sins between people require first making peace with that person. No prayer service can substitute for a sincere apology to a fellow human being.",
    spiritualTheme: "Yom Kippur teaches that no soul is beyond return. The Gates of Repentance (Sha'arei Teshuvah) remain open until the final Ne'ilah prayer — even until the last breath. This is the deepest teaching of Jewish theology: human beings are not fixed. We can change. We can return.",
    bneiManasheConnection: "The Bnei Menashe know what it means to be distant and then to return. For centuries, they preserved fragments of Jewish practice in silence. Yom Kippur's theme of return from distance — teshuvah — mirrors their own communal journey: the long exile, the preserved identity, and the redemptive return to their people.",
    hebrewQuote: { text: "כִּי בַיּוֹם הַזֶּה יְכַפֵּר עֲלֵיכֶם", translation: "For on this day He will atone for you", source: "Vayikra 16:30" },
  },

  "Sukkot": {
    hebrewName: "סֻכּוֹת",
    emoji: "🌿",
    category: "major",
    overview: "Sukkot, the Festival of Booths, begins on the 15th of Tishrei and lasts seven days. It commemorates the clouds of glory that protected Israel in the desert and celebrates the harvest. It is called Z'man Simchateinu — the Season of Our Joy.",
    observances: "We dwell in a sukkah (a temporary hut) for seven days, eat and ideally sleep inside it. We take the Four Species — palm branch (lulav), citron (etrog), myrtle (hadassim), and willow (aravot) — and wave them in six directions, symbolizing God's presence everywhere.",
    mussarLesson: "Sukkot cultivates Bitachon — Trust in God. The Sfat Emet taught that we leave our permanent homes to dwell in a fragile, temporary structure to remind ourselves that our security does not come from walls and roofs but from God's protection. The Mussar school of Kelm emphasized that Sukkot teaches us to find joy not despite impermanence but within it — a radical reorientation of what it means to feel safe. The lulav and etrog represent four types of Jews: those with Torah and good deeds, those with one but not the other, and those with neither — yet on Sukkot they are all bound together, teaching that each Jew needs the others.",
    spiritualTheme: "The sukkah is the symbol of radical joy: we have nothing but God's canopy over us, and that is enough. The clouds of glory that sheltered Israel in the desert now shelter every soul that chooses to trust.",
    bneiManasheConnection: "The Bnei Menashe lived for generations in impermanent spiritual conditions — their Jewish identity fragile, their heritage passed in whispers. Yet like the sukkah, their community endured. Now in Israel, building their own sukkot, they embody the holiday's deepest meaning: joy born from survival, trust vindicated by history.",
    hebrewQuote: { text: "וּשְׂמַחְתֶּם לִפְנֵי ה' אֱלֹהֵיכֶם שִׁבְעַת יָמִים", translation: "You shall rejoice before the Lord your God for seven days", source: "Vayikra 23:40" },
  },

  "Shemini Atzeret": {
    hebrewName: "שְׁמִינִי עֲצֶרֶת",
    emoji: "✡",
    category: "major",
    overview: "Shemini Atzeret, the Eighth Day of Assembly, immediately follows Sukkot. It is an independent holiday, yet inseparable from the Sukkot season. Rashi describes it as a private farewell celebration — God saying 'It is hard for Me to part with you.'",
    observances: "We recite Yizkor (memorial prayers for the departed), pray Geshem (prayer for rain in Israel), and complete the holiday cycle. Outside Israel it is combined with Simchat Torah.",
    mussarLesson: "Shemini Atzeret teaches Dveikut — Cleaving to God. The Mei HaShiloach explained that after the seven days of public celebration, God desires one intimate day of togetherness with His people, like a king who after a great feast asks his closest friends to stay one more day. Mussar masters taught that genuine religious life is not only about public observances and grand gestures, but about quiet, personal intimacy with the Divine. This is the day of the soul's private conversation with its Creator.",
    spiritualTheme: "After the great celebrations, God simply wants to be with us. This teaches that beyond all ritual, what God desires most is our presence — our attention, our love, our willingness to linger.",
    bneiManasheConnection: "Having returned to their people after long exile, the Bnei Menashe understand what it means to finally be close — to have survived separation and now stand in intimate proximity to their heritage. Shemini Atzeret's message of sacred closeness after a long journey resonates deeply in every Bnei Menashe heart.",
    hebrewQuote: { text: "עֲצֶרֶת תִּהְיֶה לָכֶם", translation: "An assembly shall it be for you", source: "Bamidbar 29:35" },
  },

  "Simchat Torah": {
    hebrewName: "שִׂמְחַת תּוֹרָה",
    emoji: "📜",
    category: "major",
    overview: "Simchat Torah celebrates the completion of the annual Torah reading cycle and the immediate beginning of the new cycle. We dance with the Torah scrolls (hakafot), honoring the living relationship between the Jewish people and God's word.",
    observances: "We complete reading Devarim (Deuteronomy) and immediately begin Bereishit (Genesis). Every man is called to the Torah — including children. We dance seven circuits (hakafot) with the Torah scrolls, celebrating with great joy.",
    mussarLesson: "Simchat Torah develops Ahavat Torah — Love of Torah. The Baal Shem Tov taught that the joy of Simchat Torah must be unconditional — we dance not because we have mastered the Torah but because it is ours to hold, to carry, to return to again and again. Rav Kook explained that the circular dance of hakafot mirrors the eternal nature of Torah: it has no beginning and no end, just as we immediately start again after finishing. The deepest Mussar lesson is that the moment of completion is also the moment of renewal — no achievement licenses complacency.",
    spiritualTheme: "We end and begin the Torah in the same breath, teaching that Jewish learning is never finished — it is a living conversation with God across all generations. Every year we return to 'In the Beginning,' always finding something new.",
    bneiManasheConnection: "The Bnei Menashe, who preserved their traditions in isolation, now dance with the Torah in the Land of Israel — the fulfillment of what those traditions pointed toward. Their hakafot are a dance of homecoming.",
    hebrewQuote: { text: "עֵץ חַיִּים הִיא לַמַּחֲזִיקִים בָּהּ", translation: "It is a tree of life to those who hold it fast", source: "Mishlei 3:18" },
  },

  "Chanukah": {
    hebrewName: "חֲנֻכָּה",
    emoji: "🕎",
    category: "minor",
    overview: "Chanukah, the Festival of Lights, commemorates the Maccabee victory over the Hellenist forces in 165 BCE and the miraculous burning of one day's worth of oil for eight days in the rededicated Temple. It is observed for eight nights beginning on the 25th of Kislev.",
    observances: "We light the chanukiah (menorah) each night, adding one candle per night. We recite Hallel (Psalms of praise) and Al HaNissim in our prayers. We play dreidel, eat oil-fried foods (latkes, sufganiyot), and publicize the miracle by placing the menorah where it can be seen.",
    mussarLesson: "Chanukah demands Ometz Lev — Courage of Heart. The Sfas Emes taught that the small jar of undefiled oil represents the hidden point of purity within every Jew — the place inside us that the forces of assimilation and compromise cannot reach. Rav Yitzchak Hutner explained that the miracle was not only in the oil burning longer than expected; it was in the Maccabees' willingness to light it at all, knowing it would last only one day. Mussar teaches: act on the good you can do today, even when the outcome seems impossible. The light of one pure act illuminates more darkness than we can calculate.",
    spiritualTheme: "A little light pushes away a great deal of darkness. Chanukah teaches that Jewish identity is not maintained through great armies but through the courage to keep one small flame burning — in our homes, in our hearts, in our communities.",
    bneiManasheConnection: "The Bnei Menashe kept their Jewish flame alive for generations against enormous odds — the darkness of distance, forgetfulness, and isolation. Their very survival is the Chanukah miracle repeated in Northeast India. Now they light the chanukiah in Israel, adding light to light.",
    hebrewQuote: { text: "נֵר מִצְוָה וְתוֹרָה אוֹר", translation: "The commandment is a lamp, and the Torah is light", source: "Mishlei 6:23" },
  },

  "Tu BiShvat": {
    hebrewName: "טו בִּשְׁבָט",
    emoji: "🌳",
    category: "minor",
    overview: "Tu BiShvat, the New Year of Trees, falls on the 15th of Shvat. It marks the point in winter when the sap begins to rise in the trees of the Land of Israel, technically beginning the new year for the purpose of fruit tithes.",
    observances: "We eat fruits associated with the Land of Israel — especially the seven species (wheat, barley, grapes, figs, pomegranates, olives, dates). Many observe a Tu BiShvat seder based on the kabbalistic practice of the Ari z'al. It is a custom to plant trees in Israel.",
    mussarLesson: "Tu BiShvat teaches Savlanut — Patience and the virtue of slow, rooted growth. The Torah famously compares a person to a tree (Devarim 20:19). Rav Shamshon Raphael Hirsch taught that the tree is the perfect metaphor for character development: growth is invisible, slow, and underground before it ever becomes visible above the surface. The Mussar masters taught that a person must invest in their 'roots' — their inner character, their relationship with Torah — before expecting external fruits. We do not plant a tree expecting fruit tomorrow. Character, like a tree, takes seasons.",
    spiritualTheme: "The sap rising invisibly within the winter tree is a metaphor for the hidden life of the soul — spiritual growth that continues even when we cannot perceive it. On Tu BiShvat, we celebrate that beneath the surface, life is always moving upward.",
    bneiManasheConnection: "The Bnei Menashe planted seeds of Jewish practice in Manipur and Mizoram for generations before those seeds bore visible fruit in aliyah and recognition. Like the trees of Tu BiShvat, their identity grew quietly underground, waiting for the season of return.",
    hebrewQuote: { text: "כִּי הָאָדָם עֵץ הַשָּׂדֶה", translation: "For the human being is like the tree of the field", source: "Devarim 20:19" },
  },

  "Purim": {
    hebrewName: "פּוּרִים",
    emoji: "🎭",
    category: "major",
    overview: "Purim celebrates the salvation of the Jewish people in ancient Persia, as recorded in Megillat Esther. The villain Haman cast lots (purim) to determine the date of Jewish annihilation; instead, through Esther and Mordechai's courage, the decree was reversed.",
    observances: "We hear the Megillah (scroll of Esther) twice — at night and by day. We send mishloach manot (food gifts) to friends, give matanot l'evyonim (charity to the poor), and eat a festive meal. It is a custom to dress in costumes and to celebrate with unusual joy.",
    mussarLesson: "Purim cultivates Bitachon and Simcha — Trust and Joy in God's hidden providence. The name Esther comes from the Hebrew hester, meaning 'hidden' — God's name does not appear once in the entire Megillah, yet His hand is everywhere. Rav Tzadok HaKohen of Lublin taught that Purim shows us how to find God precisely in the places He seems absent. The Mussar challenge of Purim is to develop the spiritual sensitivity to recognize divine orchestration within the apparent chaos of ordinary life — to see that what looks like coincidence is really Providence. This is the deeper meaning of wearing costumes: beneath every external mask is a hidden reality.",
    spiritualTheme: "The Megillah teaches that salvation comes through ordinary human actions — a queen's courage, a wise elder's refusal to bow. God works through us. Our choices matter. The entire destiny of a people turned on one person's decision.",
    bneiManasheConnection: "Like Esther in Persia, the Bnei Menashe maintained their identity in a foreign land without outward markers of Jewish life. Their 'hidden' Jewish nature — preserved in songs, customs, and oral traditions — waited for its moment of revelation, as Esther waited for hers.",
    hebrewQuote: { text: "לַיְּהוּדִים הָיְתָה אוֹרָה וְשִׂמְחָה וְשָׂשֹׂן וִיקָר", translation: "The Jews had light and joy and gladness and honor", source: "Esther 8:16" },
  },

  "Ta'anit Esther": {
    hebrewName: "תַּעֲנִית אֶסְתֵּר",
    emoji: "⬜",
    category: "fast",
    overview: "Ta'anit Esther, the Fast of Esther, is observed on the 13th of Adar, the day before Purim. It commemorates the three-day fast observed by Esther and the Jewish people before she approached King Achashverosh unsummoned — a potentially fatal act.",
    observances: "We fast from dawn until nightfall. This is a minor fast, less strict than Yom Kippur or Tisha B'Av. We then immediately begin the Purim celebration at nightfall with the Megillah reading.",
    mussarLesson: "Ta'anit Esther teaches Bitul HaRatzon — Self-Nullification Before a Higher Purpose. Esther declared 'Go and gather all the Jews… and fast for me. Do not eat or drink for three days' (Esther 4:16). The Chofetz Chaim taught that Esther's fast was an act of complete surrender — she released control of the outcome and placed herself entirely in God's hands. The greatest obstacle to courage is self-preservation; when we fast, we symbolically nullify our own desires and physical comfort for the sake of something greater than ourselves. This is the inner work that makes great acts possible.",
    spiritualTheme: "Before every moment of great courage, there must be a moment of inner preparation — of quieting the self, of turning to God. Esther's fast teaches that heroism is not spontaneous but cultivated through spiritual discipline.",
    bneiManasheConnection: "The Bnei Menashe's journey back to Israel required generations of quiet fasting — of waiting, of restraint, of trusting that the time would come. Their patient preservation of Jewish identity, without the reward of recognition, mirrors Esther's three days of silent preparation.",
    hebrewQuote: { text: "לֵךְ כְּנוֹס אֶת כָּל הַיְּהוּדִים... וְצוּמוּ עָלַי", translation: "Go, gather all the Jews… and fast on my behalf", source: "Esther 4:16" },
  },

  "Pesach": {
    hebrewName: "פֶּסַח",
    emoji: "🍷",
    category: "major",
    overview: "Pesach, Passover, commemorates the Exodus from Egypt — the foundational event of Jewish nationhood. Observed for seven days (eight in the diaspora) beginning on the 15th of Nisan, it is the most widely observed of all Jewish holidays and the most frequently cited event in the entire Torah.",
    observances: "We remove all chametz (leavened bread) from our homes, eat matzah for seven days, and conduct the Passover Seder — a ritual meal with readings from the Haggadah, four cups of wine, bitter herbs (maror), and symbolic foods. We retell the story of Egypt and discuss its meaning for our own generation.",
    mussarLesson: "Pesach demands Cheruit — Inner Freedom. The Sfat Emet taught that 'Mitzrayim' (Egypt) comes from the Hebrew word for 'narrow place' (meitzarim) — every person carries their own Egypt, the internal constrictions of habit, fear, and ego that prevent them from becoming who they truly can be. Rav Dessler taught in Michtav Me'Eliyahu that physical freedom without spiritual freedom is meaningless. The chametz we remove from our homes represents the puffed-up ego — the yeast of arrogance — that prevents us from being receptive to God's word. The matzah, flat and humble, is the bread of liberation. True freedom is freedom from the tyranny of our own lower nature.",
    spiritualTheme: "In every generation, each person is obligated to see themselves as if they personally left Egypt. The Exodus is not history — it is an ongoing internal experience. Every day we can choose to leave our narrow places and walk toward the Promised Land.",
    bneiManasheConnection: "The Exodus is the Bnei Menashe's own story: a people who spent long years in a foreign land, preserved their identity against enormous pressure, and finally made their own exodus — their aliyah — to the Promised Land. Every Pesach Seder they conduct in Israel is both memory and autobiography.",
    hebrewQuote: { text: "בְּכָל דּוֹר וָדוֹר חַיָּב אָדָם לִרְאוֹת אֶת עַצְמוֹ כְּאִלּוּ הוּא יָצָא מִמִּצְרַיִם", translation: "In every generation, each person is obligated to see themselves as if they personally left Egypt", source: "Haggadah, Pesachim 116b" },
  },

  "Lag BaOmer": {
    hebrewName: "לַ״ג בָּעֹמֶר",
    emoji: "🔥",
    category: "minor",
    overview: "Lag BaOmer, the 33rd day of the Omer count (18 Iyar), marks the cessation of a plague that killed 24,000 students of Rabbi Akiva. It is also the yahrzeit of Rabbi Shimon bar Yochai, author of the Zohar, who is said to have revealed great mystical secrets on the day of his passing.",
    observances: "We light bonfires, engage in archery, get haircuts (the first since Pesach), and hold celebrations. In Israel, vast crowds gather at the grave of Rabbi Shimon bar Yochai at Meron. The mourning restrictions of the Omer period are lifted.",
    mussarLesson: "Lag BaOmer teaches Kavod HaBriot — Respect for Every Human Being. The Talmud (Yevamot 62b) records that Rabbi Akiva's 24,000 students died because they did not treat each other with sufficient respect — 'they did not honor one another.' The plague stopped on Lag BaOmer. The Mussar masters drew a devastating lesson: the greatest scholars of their generation, people of extraordinary learning and piety, were destroyed not by external enemies but by their failure to practice basic human dignity toward each other. No Torah knowledge compensates for contempt toward a fellow person. Rabbi Akiva's own greatest teaching was 'Love your neighbor as yourself — this is a great principle of the Torah.'",
    spiritualTheme: "Jewish survival depends not on intellectual brilliance alone but on genuine love between Jews. The bonfires of Lag BaOmer light up the darkness of division. We celebrate Rabbi Shimon's light while remembering the darkness that came from disunity.",
    bneiManasheConnection: "A community that crossed oceans and deserts to return to their people understands the value of Jewish unity. The Bnei Menashe bring a perspective of outsiders who became insiders — they know what it costs to be excluded, and what it means to be welcomed. Their experience is a living argument for Kavod HaBriot.",
    hebrewQuote: { text: "וְאָהַבְתָּ לְרֵעֲךָ כָּמוֹךָ — זֶה כְּלָל גָּדוֹל בַּתּוֹרָה", translation: "Love your neighbor as yourself — this is a great principle of the Torah", source: "Vayikra 19:18, Yerushalmi Nedarim 9:4" },
  },

  "Shavuot": {
    hebrewName: "שָׁבוּעוֹת",
    emoji: "⛰️",
    category: "major",
    overview: "Shavuot, the Festival of Weeks, falls on the 6th of Sivan, exactly 50 days after Pesach. It commemorates the giving of the Torah at Mount Sinai — the moment that transformed the Israelites from a freed nation into the Jewish people covenanted with God.",
    observances: "We stay awake all night to study Torah (Tikkun Leil Shavuot), hear the Ten Commandments in synagogue, eat dairy foods, decorate our synagogues and homes with flowers, and read the Book of Ruth.",
    mussarLesson: "Shavuot cultivates Kabbalat Ol Malchut Shamayim — Accepting the Yoke of Heaven with Joy. The Maharal of Prague asked: why did the Israelites receive the Torah at the base of a mountain with God holding it over their heads? He answered that sometimes the highest form of freedom is willing submission to something greater than oneself. The Mussar masters taught that the all-night Torah study is not about accumulating information but about experiencing the moment of Sinai personally — allowing God's wisdom to descend into our souls. The dairy foods symbolize purity and nourishment; like milk that comes naturally from its source, Torah should flow naturally from a pure heart.",
    spiritualTheme: "The entire Jewish people — men, women, children, even future converts — stood at Sinai. Every Jewish soul was present. Shavuot asks us to remember what we committed to that day, and to recommit ourselves to living that covenant.",
    bneiManasheConnection: "The Bnei Menashe tradition holds that their ancestor Manasseh stood at Sinai with the other tribes. Shavuot is the day they reclaim their portion of the covenant — not as newcomers to Judaism but as descendants of those who were always there. Their aliyah is itself a form of Kabbalat HaTorah.",
    hebrewQuote: { text: "נַעֲשֶׂה וְנִשְׁמָע", translation: "We will do and we will hear", source: "Shemot 24:7" },
  },

  "Tisha B'Av": {
    hebrewName: "תִּשְׁעָה בְּאָב",
    emoji: "😢",
    category: "fast",
    overview: "Tisha B'Av, the Ninth of Av, is the saddest day of the Jewish year. It commemorates multiple national tragedies that occurred on this date: the destruction of both the First and Second Temples, the expulsion from Spain in 1492, and other catastrophes throughout Jewish history.",
    observances: "We fast for 25 hours, abstaining from food, water, bathing, leather shoes, marital relations, and learning Torah (which 'gladdens the heart'). We sit low to the ground or on the floor, read Megillat Eicha (Lamentations), and recite Kinot (elegies). The day begins as a mourning and ends with hope for redemption.",
    mussarLesson: "Tisha B'Av demands Ahavat Chinam — Baseless Love. The Talmud (Yoma 9b) teaches with devastating clarity: the First Temple was destroyed because of the three cardinal sins, but the Second Temple — built by a generation of great Torah scholars — was destroyed because of sinat chinam, baseless hatred between Jews. The Chofetz Chaim dedicated his life to this teaching: if the Temple was destroyed by hatred, it can only be rebuilt by love. Tisha B'Av is not merely a memorial; it is a diagnosis and a prescription. Every act of kindness, every decision to see the good in a fellow Jew, is a brick in the rebuilt Temple. Rav Kook taught that the remedy for sinat chinam is ahavat chinam — loving our fellow Jews for no reason other than that they are our brothers and sisters.",
    spiritualTheme: "We mourn what we destroyed through division. And in mourning, we find the seed of repair. The book of Eicha ends with the plea: 'Return us to You, O God, and we shall return; renew our days as of old.' The path from destruction to redemption runs through human hearts, not armies.",
    bneiManasheConnection: "A community that experienced the pain of being doubted, questioned, and at times excluded by fellow Jews understands the cost of sinat chinam from the inside. The Bnei Menashe's perseverance in the face of such doubt — and their continued love for their people — is itself a form of ahavat chinam, and a contribution to the rebuilding.",
    hebrewQuote: { text: "מִקְדָּשׁ אֲדֹנָי זְכוּר יוֹם אַף חֲרוֹן", translation: "O Lord, remember the day Jerusalem fell — the day of Your fierce anger", source: "Eicha 1:12" },
  },

  "17 of Tammuz": {
    hebrewName: "שִׁבְעָה עָשָׂר בְּתַמּוּז",
    emoji: "⬜",
    category: "fast",
    overview: "The Fast of the 17th of Tammuz marks the beginning of the Three Weeks of mourning leading to Tisha B'Av. On this date, the walls of Jerusalem were breached by the Romans (and on a parallel date, the walls were breached by the Babylonians). Moses also broke the first tablets on this day upon descending from Sinai.",
    observances: "We fast from dawn until nightfall (a minor fast, less strict than Tisha B'Av). This begins the period called 'Bein HaMetzarim' (Between the Straits) — three weeks during which we refrain from celebrations, haircuts, listening to music, and purchasing new clothing.",
    mussarLesson: "The 17th of Tammuz teaches us to Guard the Walls — Shmirat HaGevulot. The city's walls were not breached suddenly; they were worn down over a long siege. Rav Yerucham Levovitz of Mir taught that this is how all spiritual failures begin — not with a dramatic collapse but with the slow erosion of small boundaries. We allow 'just this once,' then 'just this time,' then the walls are gone. The 17th of Tammuz asks us to examine where we have been allowing our personal boundaries to erode — in our speech, in our honesty, in our commitments. The Three Weeks are a time of inner audit.",
    spiritualTheme: "Between the breaching of the walls (17 Tammuz) and the destruction of the Temple (9 Av), there are three weeks to ask: what allowed the breach? What were we not guarding? The fast invites us to strengthen our inner walls before the outer ones can be rebuilt.",
    bneiManasheConnection: "A community that preserved its identity against centuries of cultural erosion knows what it means to guard one's walls. The Bnei Menashe maintained their Jewish boundaries — their customs, their dietary laws, their prayers — precisely because they understood intuitively what happens when walls fall.",
    hebrewQuote: { text: "עַל אֵלֶּה אֲנִי בוֹכִיָּה עֵינִי עֵינִי יֹרְדָה מָּיִם", translation: "For these things do I weep; my eye runs down with water", source: "Eicha 1:16" },
  },

  "Tzom Gedaliah": {
    hebrewName: "צוֹם גְּדַלְיָה",
    emoji: "⬜",
    category: "fast",
    overview: "Tzom Gedaliah, the Fast of Gedaliah, is observed on the 3rd of Tishrei (the day after Rosh Hashana). It mourns the assassination of Gedaliah ben Achikam, the Jewish governor appointed by Babylon after the Temple's destruction — an act that extinguished the last ember of Jewish self-governance in Israel.",
    observances: "We fast from dawn to nightfall. This is a minor fast, observed immediately after the joy of Rosh Hashana, teaching that grief and joy are never far apart in Jewish history.",
    mussarLesson: "Tzom Gedaliah teaches the Sanctity of Jewish Life and the danger of Baseless Suspicion. Gedaliah was warned by a reliable source that Yishmael planned to murder him, but he refused to believe it — choosing to assume good faith. The Chofetz Chaim cited this tragedy as proof that even the most noble instincts, when applied without discernment, can have devastating consequences. Yet our sages also teach that we fast because the death of a righteous person is as tragic as the burning of the Temple itself — each Jewish life is an entire world. Mussar demands that we hold both truths: judge favorably, but also be wise enough to protect what is sacred.",
    spiritualTheme: "The death of Gedaliah ended the remnant of Jewish sovereignty in Israel for centuries. It teaches that the loss of one righteous leader can unravel an entire community's future. Leadership, protection, and community are sacred responsibilities.",
    bneiManasheConnection: "The Bnei Menashe know the weight of communal survival. They know what it costs when leadership fails, and what it means to rebuild from a remnant. The tiny flame of Jewish identity they kept alive through generations makes them especially attuned to how precious each ember of Jewish life truly is.",
    hebrewQuote: { text: "וּמִיתַת צַדִּיקִים קָשָׁה לִפְנֵי הַקָּדוֹשׁ בָּרוּךְ הוּא כִּשְׂרֵפַת בֵּית אֱלֹהֵינוּ", translation: "The death of the righteous is as grievous before the Holy One as the burning of the Temple", source: "Rosh Hashana 18b" },
  },

  "Asara B'Tevet": {
    hebrewName: "עֲשָׂרָה בְּטֵבֵת",
    emoji: "⬜",
    category: "fast",
    overview: "Asara B'Tevet, the Tenth of Tevet, commemorates the beginning of the Babylonian siege of Jerusalem under Nebuchadnezzar in 588 BCE — the first link in the chain of events that led to the Temple's destruction.",
    observances: "We fast from dawn to nightfall. In Israel, it is also observed as a general Kaddish day for Holocaust victims whose exact yahrzeits are unknown.",
    mussarLesson: "Asara B'Tevet teaches Yirat HaReshit — Awareness of Beginnings. The siege began as a distant military threat; the Temple's destruction was still two years away. Yet the fast commemorates the beginning — the first encirclement — because the sages understood that every catastrophe has a first moment, often overlooked. Rav Eliyahu Dessler taught that most spiritual failure follows the same pattern: a first small concession, a first small compromise, a first small step toward the wrong direction that seems harmless at the time. Tevet teaches us to fast at the beginning — to take seriously the first signs of siege, whether in our communities or in our own souls.",
    spiritualTheme: "The siege began from the outside; the real battle, as always, was inside. Asara B'Tevet asks us to look at where our own spiritual life is under siege — what habits, distractions, or compromises have encircled us — and to act before the walls fall.",
    bneiManasheConnection: "A community whose identity was under slow siege for centuries — by distance, by assimilation pressure, by the absence of Jewish infrastructure — knows intimately what it means to survive an encirclement. The Bnei Menashe held their ground. Asara B'Tevet honors that kind of endurance.",
    hebrewQuote: { text: "בֶּן-אָדָם כְּתָב-לְךָ אֶת-שֵׁם הַיּוֹם אֶת-עֶצֶם הַיּוֹם הַזֶּה", translation: "Son of man, write down the name of this day, this very day", source: "Yechezkel 24:2" },
  },

  "Tu B'Av": {
    hebrewName: "טוּ בְּאָב",
    emoji: "💛",
    category: "minor",
    overview: "Tu B'Av, the 15th of Av, is described in the Mishnah as one of the two greatest days of joy in the Jewish calendar. It marks the cessation of the tragedies of the summer, the beginning of the grape harvest, and historically a day when young women would dance in the vineyards.",
    observances: "There are no specific halakhic observances. It is a day of joy, often associated with love, relationships, and community celebration. The Talmud records multiple historical events that occurred on this day, all involving unity and reconciliation.",
    mussarLesson: "Tu B'Av teaches Simcha — Joy as a Spiritual Practice. The Talmud (Taanit 30b) says that just as Av begins, we diminish our joy; when Av ends, our joy increases. Joy is not merely an emotion; it is a religious obligation. Rav Nachman of Breslov taught that joy is the highest service of God — it requires tremendous inner work to cultivate authentic joy in a world of difficulty. Tu B'Av comes immediately after the darkest period of the Jewish calendar, and its message is: joy returns. Darkness does not have the last word. The Mussar tradition teaches us to actively pursue simcha — to choose to find the good, to celebrate what we have, to dance even after mourning.",
    spiritualTheme: "Joy after grief is the deepest kind of joy — it has passed through sorrow and emerged refined. Tu B'Av teaches that the Jewish people are never defined by our tragedies but by our capacity to rejoice again.",
    bneiManasheConnection: "After generations of longing and the challenges of aliyah, the Bnei Menashe have earned their Tu B'Av. Their communal celebrations in Israel — dancing, singing, building families in the land of their ancestors — are the living fulfillment of this holiday's promise.",
    hebrewQuote: { text: "לֹא הָיוּ יָמִים טוֹבִים לְיִשְׂרָאֵל כַּחֲמִשָּׁה עָשָׂר בְּאָב", translation: "There were no better days for Israel than the 15th of Av", source: "Mishnah Taanit 4:8" },
  },

  "Rosh Chodesh": {
    hebrewName: "רֹאשׁ חֹדֶשׁ",
    emoji: "🌙",
    category: "rosh_chodesh",
    overview: "Rosh Chodesh, the New Month, marks the beginning of each month of the Hebrew calendar. It is the first mitzvah given to the Jewish people as a nation (Shemot 12:2) — 'This month shall be for you the beginning of months.' The Jewish calendar is lunar, making the moon's renewal a monthly marker of sacred time.",
    observances: "We recite Hallel (half-Hallel on Rosh Chodesh), Musaf prayer, Ya'aleh V'Yavo in Amidah, and read from the Torah. Work restrictions are lighter than on full holidays. There is a tradition that Rosh Chodesh is especially connected to Jewish women, who refused to donate their jewelry for the Golden Calf.",
    mussarLesson: "Rosh Chodesh teaches Chidush — Renewal and the Power of Beginning Again. The moon wanes completely and then returns — this is the deepest symbol of teshuvah (repentance and return). Rav Kook taught that the moon's renewal is a divine promise embedded in nature: no matter how diminished we become, renewal is always possible. Every month, God gifts us with a new beginning. The Mussar masters taught that we must not become imprisoned by who we were yesterday. Each new month is an invitation to choose differently, to begin again, to let the light return.",
    spiritualTheme: "The Jewish calendar is built on the moon — on cycles of diminishment and renewal. Rosh Chodesh teaches us to make peace with our own cycles: times of fullness and times of darkness, knowing that the light always returns.",
    bneiManasheConnection: "The Bnei Menashe lived through their own 'waning' — centuries when their Jewish light was dim and nearly invisible. Their return to Judaism and to Israel is the moon's renewal in human form. Each Rosh Chodesh they observe in Israel is a celebration of the light that returned.",
    hebrewQuote: { text: "הַחֹדֶשׁ הַזֶּה לָכֶם רֹאשׁ חֳדָשִׁים", translation: "This month shall be for you the beginning of months", source: "Shemot 12:2" },
  },

  "Yom HaShoah": {
    hebrewName: "יוֹם הַשּׁוֹאָה",
    emoji: "🕯",
    category: "modern",
    overview: "Yom HaShoah VeHaGevurah — Holocaust and Heroism Remembrance Day — is observed on the 27th of Nisan, one week after Pesach. It is Israel's national day of Holocaust commemoration, marking the beginning of the Warsaw Ghetto Uprising in 1943.",
    observances: "In Israel, sirens sound for two minutes at 10 AM and the entire country stands in silence. Memorial ceremonies are held at Yad Vashem. Candles are lit in memory of the six million. Stories of survivors are shared to ensure the memory is transmitted.",
    mussarLesson: "Yom HaShoah demands Zachor — Sacred Memory as a Moral Obligation. The Torah commands 'Remember what Amalek did to you' (Devarim 25:17) — not as an act of hatred, but as vigilance. The Lubavitcher Rebbe taught that each survivor carries the souls of those who did not survive, and each person who remembers carries the survivors' testimony forward. Mussar demands that memory be active, not passive — that we do not merely feel sad but allow the knowledge of evil to sharpen our commitment to goodness. The Shoah is the ultimate argument for Jewish continuity, for raising Jewish children, for supporting Jewish communities everywhere. To remember is to resist.",
    spiritualTheme: "Six million Jewish lives were extinguished — yet the Jewish people live. The State of Israel, established three years after the Shoah's end, is the most powerful collective response to hatred in human history. Yom HaShoah teaches that survival itself is a form of sanctity.",
    bneiManasheConnection: "The Bnei Menashe were far from Europe during the Shoah, yet they are part of the same people whose world was destroyed. Their aliyah — their decision to live as Jews in the Jewish homeland — is itself an act of Jewish continuity that the Shoah's perpetrators sought to prevent forever.",
    hebrewQuote: { text: "זָכוֹר אֵת אֲשֶׁר עָשָׂה לְךָ", translation: "Remember what was done to you", source: "Devarim 25:17" },
  },

  "Yom HaZikaron": {
    hebrewName: "יוֹם הַזִּכָּרוֹן",
    emoji: "🪖",
    category: "modern",
    overview: "Yom HaZikaron, Israel's Memorial Day for Fallen Soldiers and Victims of Terrorism, is observed on the 4th of Iyar, the day before Yom HaAtzmaut. The intentional placement — mourning immediately before celebration — teaches that Israel's independence was paid for with irreplaceable human lives.",
    observances: "Sirens sound twice: at nightfall and at 11 AM. All of Israel stands in silence. Memorial ceremonies are held at military cemeteries. Flags fly at half-mast. Entertainment venues are closed. Families gather at gravesites.",
    mussarLesson: "Yom HaZikaron teaches Hakaras HaTov — Gratitude for what others sacrificed on our behalf. The Mussar master Rav Shlomo Wolbe taught that ingratitude is the root of all moral failure: when we cease to recognize what others have given us, we become capable of any selfishness. Every Jew who lives in the State of Israel — or who benefits from its existence — owes a debt of gratitude to those who gave their lives to build and defend it. The transition from Yom HaZikaron to Yom HaAtzmaut is a Mussar lesson in itself: we are not permitted to celebrate without first acknowledging the cost.",
    spiritualTheme: "Israel's independence did not fall from heaven — it was purchased with Jewish blood. Yom HaZikaron insists that we never confuse comfort with entitlement. The state we have is a trust given to us by those who are no longer here to enjoy it.",
    bneiManasheConnection: "Bnei Menashe young people serve in the Israel Defense Forces, including in combat roles. Their willingness to defend the land of their ancestors is one of the most moving aspects of the community's absorption into Israeli life — from exile to soldier in one generation.",
    hebrewQuote: { text: "אֵין לְךָ בֶּן חוֹרִין אֶלָּא מִי שֶׁעוֹסֵק בְּתַלְמוּד תּוֹרָה", translation: "None is free but one who engages in Torah study", source: "Avot 6:2" },
  },

  "Yom HaAtzmaut": {
    hebrewName: "יוֹם הָעַצְמָאוּת",
    emoji: "🇮🇱",
    category: "modern",
    overview: "Yom HaAtzmaut, Israeli Independence Day, is celebrated on the 5th of Iyar, marking the declaration of Israel's independence on May 14, 1948 (5 Iyar 5708). After 2,000 years of exile, the Jewish people returned to sovereign existence in their ancestral homeland.",
    observances: "We recite Hallel in synagogue (with or without a blessing, depending on community custom). Celebrations include fireworks, outdoor barbecues, concerts, and communal gatherings. It is a national holiday in Israel.",
    mussarLesson: "Yom HaAtzmaut calls us to Hakarat Nes — Recognizing the Miracle. Rav Kook, who devoted his life to the vision of Israel's redemption, taught that the ingathering of exiles is the beginning of 'the first flowering of our redemption' (reishit tzmichat ge'ulateinu). The Mussar challenge is not to take this miracle for granted. After 2,000 years, a Jewish state exists — with Jewish police, Jewish courts, Jewish hospitals, a Jewish army. This is historically unprecedented. The deepest form of gratitude is not a moment of emotion but a lifetime of responsible stewardship of what we have been given. To live in Israel with awareness is itself a form of prayer.",
    spiritualTheme: "The State of Israel is the physical manifestation of a 2,000-year prayer. Yom HaAtzmaut asks: now that we have the land, what are we doing with it? Independence is not an end — it is a beginning of our greatest responsibilities.",
    bneiManasheConnection: "For the Bnei Menashe, Yom HaAtzmaut is deeply personal. The State of Israel's existence is what made their aliyah possible. Without Israeli sovereignty, the law of return, and the Jewish Agency, their return from Manipur and Mizoram would have remained only a dream. They celebrate Israel's independence as their own liberation.",
    hebrewQuote: { text: "וְשַׁבְתִּי אֶתְכֶם מִכָּל הַגּוֹיִם... וְהֵבֵאתִי אֶתְכֶם אֶל אַדְמַתְכֶם", translation: "I will take you from all the nations… and bring you to your own land", source: "Yechezkel 36:24" },
  },

  "Shabbat Shekalim": {
    hebrewName: "שַׁבָּת שְׁקָלִים",
    emoji: "⚖️",
    category: "shabbat_special",
    overview: "Shabbat Shekalim is the first of the four special Shabbatot that precede Pesach. It falls on the Shabbat before (or on) Rosh Chodesh Adar, and commemorates the Temple-era practice of collecting the annual half-shekel tax from every Jew.",
    observances: "An additional Torah portion (Shemot 30:11-16) is read, describing the half-shekel donation. In Temple times, this was the period when the shekalim were collected to fund the communal offerings.",
    mussarLesson: "Shabbat Shekalim teaches Arvut — Communal Responsibility. Every Jew — rich or poor — gave exactly the same half-shekel. The Sforno explained: the half-shekel, not a whole shekel, because no person is complete alone. We become whole only in community. The Mussar masters taught that Jewish law builds communal solidarity into its financial system: the same amount from everyone teaches that in God's eyes, wealth does not increase a person's communal standing. We are all equal contributors to the sacred work of sustaining our people.",
    spiritualTheme: "The half-shekel teaches that every Jew is equally essential to the whole. No one's contribution is too small; no one's absence goes unnoticed. The community needs each of us.",
    bneiManasheConnection: "The Bnei Menashe were once counted as absent — their shekel uncollected, their seat in the community empty. Now they contribute fully to Israeli society, to the IDF, to the economy, to Jewish continuity. Their inclusion completes a circle that had been broken for millennia.",
    hebrewQuote: { text: "הֶעָשִׁיר לֹא יַרְבֶּה וְהַדַּל לֹא יַמְעִיט", translation: "The rich shall not give more, and the poor shall not give less", source: "Shemot 30:15" },
  },

  "Shabbat Zachor": {
    hebrewName: "שַׁבָּת זָכוֹר",
    emoji: "📣",
    category: "shabbat_special",
    overview: "Shabbat Zachor, the Shabbat of Remembrance, is the Shabbat immediately before Purim. Its special Torah reading (Devarim 25:17-19) commands us to remember what Amalek did to Israel and to never forget. The obligation to hear this portion is considered a biblical commandment.",
    observances: "We read the special maftir portion about Amalek. There is a strong obligation for every Jew — including women — to hear this reading, making it one of the most widely attended Torah readings of the year.",
    mussarLesson: "Shabbat Zachor teaches Zechira — Active Memory as Resistance. The command is not merely 'know' but 'remember' — to actively maintain awareness of evil so that we remain vigilant. The Sfat Emet explained that 'Amalek' represents the force of doubt and cynicism that attacks our relationship with God — the inner voice that says 'maybe none of this is real, maybe it doesn't matter.' The war against Amalek is the war against spiritual indifference. The Mussar lesson is that we must not allow familiarity to breed complacency about evil — we must remember, name it, and resist it actively in every generation.",
    spiritualTheme: "Memory is not passive — it is a weapon. The Torah commands us to remember Amalek precisely because forgetting evil is how evil returns. Shabbat Zachor teaches eternal vigilance as a form of holiness.",
    bneiManasheConnection: "A community that preserved memory across centuries — holding onto Jewish identity when all external reinforcement was absent — embodies the spirit of Zachor. The Bnei Menashe remembered when it would have been easier to forget.",
    hebrewQuote: { text: "זָכוֹר אֵת אֲשֶׁר-עָשָׂה לְךָ עֲמָלֵק", translation: "Remember what Amalek did to you", source: "Devarim 25:17" },
  },

  "Shabbat HaGadol": {
    hebrewName: "שַׁבָּת הַגָּדוֹל",
    emoji: "🌟",
    category: "shabbat_special",
    overview: "Shabbat HaGadol, the Great Shabbat, is the Shabbat immediately before Pesach. On this day before the first Passover, the Israelites took the Passover lambs — which the Egyptians worshipped — and tied them to their bedposts for four days, publicly demonstrating their break from Egyptian idolatry.",
    observances: "The rabbi delivers a special halachic sermon on the laws of Passover and Pesach preparation. We read a special Haftarah from Malachi (3:4-24). Ashkenazim begin reciting part of the Haggadah.",
    mussarLesson: "Shabbat HaGadol teaches Ometz — Moral Courage in Public. To take the Egyptian god and tie it to your bedpost required extraordinary courage — an open, public declaration of faith while still enslaved. The Shem MiShmuel taught that this act of public commitment is what made the Israelites ready for redemption: they chose their identity openly before they were free. Mussar teaches that authentic commitment must eventually become visible. The inner conviction that remains purely private, never expressed in action or declaration, is not yet complete. Shabbat HaGadol asks: in what ways am I ready to tie the lamb to my bedpost — to make my values visible despite social pressure?",
    spiritualTheme: "Redemption does not begin at the Red Sea — it begins at the moment when we choose our identity publicly and bear the consequences. The Exodus was prepared by an act of courage, not an act of waiting.",
    bneiManasheConnection: "The Bnei Menashe's decision to formally identify as Jews — to publicly return to their faith and seek aliyah — required exactly the courage of Shabbat HaGadol. They declared their identity before the world, before their process was complete, trusting that the redemption would follow.",
    hebrewQuote: { text: "וְנִגַּשְׁתֶּם אֶל שַׁר בֵּיתוֹ", translation: "And approach the steward of his house", source: "Shemot 4:20 (Midrash on the lamb)" },
  },
};

export function getHolidayInsight(holidayName: string): HolidayStaticInsight | null {
  const name = holidayName.toLowerCase();
  for (const [key, insight] of Object.entries(INSIGHTS)) {
    if (name.includes(key.toLowerCase())) return insight;
  }
  // Partial matches
  if (name.includes("rosh hashana") || name.includes("rosh ha-shanah")) return INSIGHTS["Rosh Hashana"];
  if (name.includes("yom kippur")) return INSIGHTS["Yom Kippur"];
  if (name.includes("sukkot") || name.includes("sukkos")) return INSIGHTS["Sukkot"];
  if (name.includes("shemini")) return INSIGHTS["Shemini Atzeret"];
  if (name.includes("simchat") || name.includes("simchas")) return INSIGHTS["Simchat Torah"];
  if (name.includes("chanukah") || name.includes("hanukkah")) return INSIGHTS["Chanukah"];
  if (name.includes("tu bishvat") || name.includes("tu b'shvat") || name.includes("tu bisvat")) return INSIGHTS["Tu BiShvat"];
  if (name.includes("purim")) return INSIGHTS["Purim"];
  if (name.includes("esther")) return INSIGHTS["Ta'anit Esther"];
  if (name.includes("pesach") || name.includes("passover")) return INSIGHTS["Pesach"];
  if (name.includes("lag")) return INSIGHTS["Lag BaOmer"];
  if (name.includes("shavuot") || name.includes("shavuos")) return INSIGHTS["Shavuot"];
  if (name.includes("tisha") || name.includes("9 of av")) return INSIGHTS["Tisha B'Av"];
  if (name.includes("tammuz") || name.includes("17 of")) return INSIGHTS["17 of Tammuz"];
  if (name.includes("gedaliah") || name.includes("gedalya")) return INSIGHTS["Tzom Gedaliah"];
  if (name.includes("tevet") || name.includes("asara")) return INSIGHTS["Asara B'Tevet"];
  if (name.includes("tu b'av") || name.includes("tu bav")) return INSIGHTS["Tu B'Av"];
  if (name.includes("rosh chodesh")) return INSIGHTS["Rosh Chodesh"];
  if (name.includes("shoah") || name.includes("holocaust")) return INSIGHTS["Yom HaShoah"];
  if (name.includes("zikaron") || name.includes("memorial")) return INSIGHTS["Yom HaZikaron"];
  if (name.includes("atzmaut") || name.includes("independence")) return INSIGHTS["Yom HaAtzmaut"];
  if (name.includes("shekalim")) return INSIGHTS["Shabbat Shekalim"];
  if (name.includes("zachor")) return INSIGHTS["Shabbat Zachor"];
  if (name.includes("hagadol") || name.includes("ha-gadol")) return INSIGHTS["Shabbat HaGadol"];
  return null;
}

export function getHolidayEmoji(name: string): string {
  const insight = getHolidayInsight(name);
  if (insight) return insight.emoji;
  const n = name.toLowerCase();
  if (n.includes("shabbat")) return "🕯";
  if (n.includes("shushan")) return "🎭";
  if (n.includes("parah")) return "🌿";
  if (n.includes("hachodesh")) return "🌙";
  if (n.includes("yom haatzmaut") || n.includes("independence")) return "🇮🇱";
  if (n.includes("yom yerushalayim")) return "🏛️";
  return "✡";
}

export function getHolidayHebrewName(name: string): string {
  const insight = getHolidayInsight(name);
  return insight?.hebrewName ?? "";
}

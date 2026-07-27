export interface ParashaInsights {
  keyTheme: string;
  didYouKnow: string;
  bneiMenasheConnection: string;
  mainSources: string;
  classicalCommentary: string;
  practicalLesson: string;
  discussionQuestion: string;
  hebrewQuote: { hebrew: string; translation: string; reference: string };
  sourceReferences: string;
}

export const PARASHA_INSIGHTS: Record<string, ParashaInsights> = {
  "Bereshit": {
    keyTheme: "The purpose of creation and humanity's responsibility as stewards of the world. Bereshit establishes that the universe was created with intention, and that human beings — made in the image of God — bear the greatest responsibility for moral choices.",
    didYouKnow: "The Torah begins with the letter Beit (ב) rather than Aleph (א) — the first letter of the Hebrew alphabet. The Sages explain this is because Beit, shaped like an open house, teaches us to look forward, not backward.",
    bneiMenasheConnection: "The Bnei Menashe's journey back to their ancestral homeland mirrors the first human journey — leaving a familiar world to build a new life in an unfamiliar land under divine guidance. Like Adam, they returned to their garden.",
    mainSources: "Genesis 1:1–2:3 (creation), Genesis 2:4–3:24 (Adam and Eve), Genesis 4:1–16 (Cain and Abel), Genesis 5 (genealogy), Genesis 6:1–8 (prelude to flood)",
    classicalCommentary: "Rashi famously asks why the Torah begins with creation rather than the first commandment. He answers: so that if nations ever challenge Israel's right to the Land, Israel can reply that God, creator of all, chose to give it to them. Ramban emphasizes that the six days of creation parallel the six millennia of history.",
    practicalLesson: "Every human being is created b'tzelem Elohim — in God's image. This means every person we encounter deserves dignity and respect. Our choices, like Adam and Eve's, define the moral trajectory of our lives.",
    discussionQuestion: "In what ways does the concept of being created in God's image shape how you treat others? How does Bereshit's message about human responsibility speak to modern environmental challenges?",
    hebrewQuote: { hebrew: "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ", translation: "In the beginning God created the heavens and the earth", reference: "Genesis 1:1" },
    sourceReferences: "Genesis 1:1, Rashi on Genesis 1:1, Ramban on Genesis 1:1, Midrash Rabbah Bereshit 1:1, Talmud Sanhedrin 38a",
  },
  "Noach": {
    keyTheme: "Righteousness in a corrupt generation. Noah was 'perfect in his generations' — yet Sages debate whether this means he was great relative to his time or would have been greater had he lived in Abraham's era.",
    didYouKnow: "The dove Noah sent out is one of the most universally recognized symbols of peace. The Torah records it returned with an olive branch — a symbol the world still uses today to represent hope and reconciliation.",
    bneiMenasheConnection: "Like Noah who preserved his family and community across a massive upheaval, the Bnei Menashe preserved Jewish identity through centuries of exile, emerging to rebuild in their promised land.",
    mainSources: "Genesis 6:9–7:24 (the ark and flood), Genesis 8:1–9:17 (end of flood, covenant), Genesis 9:18–10:32 (Noah's descendants), Genesis 11:1–9 (Tower of Babel)",
    classicalCommentary: "Rashi notes that the Torah mentions Noah's righteousness before his genealogy — unlike other righteous people — to teach that his deeds came before his offspring. Maimonides saw the Noachide Laws (seven commandments for all humanity) as the ethical foundation for civilization.",
    practicalLesson: "Moral courage requires standing apart from the crowd even when it is costly. Noah built an ark for 120 years while being mocked. His perseverance teaches us that conviction must translate into consistent, daily action.",
    discussionQuestion: "Are you a 'Noah in your generation' — doing what is right relative to your surroundings — or do you hold yourself to a higher standard? How can we be righteous without becoming self-righteous?",
    hebrewQuote: { hebrew: "נֹחַ אִישׁ צַדִּיק תָּמִים הָיָה בְּדֹרֹתָיו", translation: "Noah was a righteous man, blameless in his generation", reference: "Genesis 6:9" },
    sourceReferences: "Genesis 6:9, Rashi on Genesis 6:9, Maimonides Mishneh Torah, Talmud Sanhedrin 108a, Midrash Rabbah Noach 30:9",
  },
  "Lech-Lecha": {
    keyTheme: "The call to spiritual journey and the covenant of faith. God commands Abram to leave everything familiar — land, birthplace, family — and go toward a destination revealed only step by step. This radical trust defines the Jewish spiritual posture.",
    didYouKnow: "The phrase 'Lech Lecha' (לֶךְ לְךָ) literally means 'go for yourself' or 'go to yourself.' Kabbalists interpret this as an invitation to self-discovery — the journey outward is simultaneously a journey inward.",
    bneiMenasheConnection: "The Bnei Menashe's aliyah is a living Lech Lecha. Like Abram, they heard an ancestral call, left behind the comfort of their homeland in Northeast India, and journeyed to the Land of Israel — trusting in a covenant that crosses millennia.",
    mainSources: "Genesis 12:1–9 (the call), Genesis 12:10–20 (Egypt), Genesis 15 (the covenant), Genesis 17 (circumcision), Genesis 16 (Hagar and Ishmael)",
    classicalCommentary: "Rashi identifies ten trials that Abraham faced, beginning with Lech Lecha. Nachmanides (Ramban) emphasizes that Abraham's actions in the land are a foreshadowing (ma'aseh avot siman l'banim — the deeds of the fathers are a sign for the children). The Sfat Emet teaches that Lech Lecha invites us to journeys of continuous growth.",
    practicalLesson: "Faith is not passive. Abraham acted — he packed, journeyed, and built altars — before seeing any fulfillment of the promises. Real trust in God requires movement, even without a full map.",
    discussionQuestion: "What 'familiar places' — habits, assumptions, comfort zones — might God be calling you to leave in order to grow? In what ways is aliyah (immigration to Israel) a modern Lech Lecha?",
    hebrewQuote: { hebrew: "לֶךְ-לְךָ מֵאַרְצְךָ וּמִמּוֹלַדְתְּךָ וּמִבֵּית אָבִיךָ", translation: "Go forth from your land, from your birthplace, and from your father's house", reference: "Genesis 12:1" },
    sourceReferences: "Genesis 12:1, Rashi on Genesis 12:1, Ramban on Genesis 12:6, Talmud Nedarim 32a, Pirkei Avot 5:3",
  },
  "Shelach": {
    keyTheme: "Faith versus fear in the face of challenge. Parashat Shelach revolves around the failure of ten spies who allowed fear to override faith. It is a profound lesson on how perception shapes reality and how negativity can poison an entire community.",
    didYouKnow: "The Torah mentions that the spies brought back fruit from the Land — a cluster of grapes so large it required two men to carry it. This tangible evidence of the Land's blessing was meant to inspire faith, yet the people focused on the giants instead.",
    bneiMenasheConnection: "The Bnei Menashe community, with their return to Jewish identity and aliyah to Israel, embodies the courage of Caleb and Joshua — the two spies who gave a faithful report. Just as they faced challenges in believing in their inheritance, the Bnei Menashe chose faith over fear in reclaiming their ancestral homeland.",
    mainSources: "Numbers 13:1 (God commands sending spies), Numbers 13:27–28 (the spies' report), Numbers 14:1–4 (Israel's reaction), Numbers 15:37–41 (commandment of tzitzit)",
    classicalCommentary: "Rashi explains that the spies' negative report stemmed from their biases and fear, emphasizing the role of perspective in shaping reality. Ramban highlights the importance of the spies' mission but criticizes their lack of faith. Midrash Rabbah discusses the implications of the Israelites' outcry and God's consequential decree.",
    practicalLesson: "Trusting in God amidst uncertainty is essential, and this parasha teaches us that fear can cloud our judgment, leading to missed opportunities. We should focus on the potential goodness of our 'promised lands' despite the challenges we perceive.",
    discussionQuestion: "What parallels can we draw between the spies' fear and our own challenges in faith today? How can we cultivate a mindset that focuses on God's promises despite the difficulties we face?",
    hebrewQuote: { hebrew: "וְעָשִׂיתָ עַל-צִיצַת הַכְּנָפַיִם פְּתִיל תְּכֵלֶת", translation: "And you shall make for yourselves fringes on the corners of your garments with a thread of blue", reference: "Numbers 15:38" },
    sourceReferences: "Numbers 13:1, Rashi on Numbers 13:1, Ramban on Numbers 13:1, Midrash Rabbah 15:2, Talmud Shabbat 31a",
  },
  "Yitro": {
    keyTheme: "Divine revelation and the architecture of Jewish law. Parashat Yitro contains the most dramatic moment in the Torah — the giving of the Ten Commandments at Sinai — and the wisdom of delegation and shared leadership, taught by Jethro.",
    didYouKnow: "The Talmud records that when God gave the Torah, every person heard according to their own capacity — the elders heard differently from the youth, the men from the women. The revelation was singular yet personally tailored to each soul.",
    bneiMenasheConnection: "The Bnei Menashe stood at Sinai as part of all Israel — the Talmudic principle that all Jewish souls were present at revelation (Shevuot 39a) means this parashah is a deeply personal homecoming to their spiritual roots.",
    mainSources: "Exodus 18:1–27 (Jethro's advice), Exodus 19:1–25 (preparation at Sinai), Exodus 20:1–14 (Ten Commandments), Exodus 20:15–23 (Israel's reaction)",
    classicalCommentary: "Maimonides considered the Ten Commandments the foundations of all 613 commandments. Rashi notes that Israel camped at Sinai 'as one person with one heart' — unprecedented unity. The Mechilta records that God offered the Torah to all nations before Israel accepted it.",
    practicalLesson: "Good governance requires humility. Moses — the greatest prophet — accepted counsel from his father-in-law and delegated authority. True leadership means building systems that empower others, not concentrating all power in one person.",
    discussionQuestion: "The Torah says Israel received the Ten Commandments collectively. What is the significance of receiving divine law as a community rather than as individuals? How do you keep these commandments personally alive?",
    hebrewQuote: { hebrew: "אָנֹכִי יְהוָה אֱלֹהֶיךָ אֲשֶׁר הוֹצֵאתִיךָ מֵאֶרֶץ מִצְרַיִם", translation: "I am the Lord your God who brought you out of the land of Egypt", reference: "Exodus 20:2" },
    sourceReferences: "Exodus 20:2, Rashi on Exodus 20:2, Maimonides Sefer HaMitzvot, Mechilta d'Rabbi Yishmael, Talmud Shabbat 88a",
  },
  "Vaetchanan": {
    keyTheme: "Love, memory, and the Shema. This parashah contains the Shema — Judaism's central declaration of faith — and the repetition of the Ten Commandments. Moses pleads for entry to the Land but is refused, teaching us about acceptance and legacy.",
    didYouKnow: "The Shema is recited twice daily by observant Jews. The Talmud records that Rabbi Akiva recited the Shema as he was martyred, drawing out the word 'Echad' (one) with his last breath — a moment of ultimate faith under ultimate duress.",
    bneiMenasheConnection: "The Shema — 'Hear O Israel' — has been the watchword of the Bnei Menashe's return to Judaism. Reciting it reconnects them to a chain of tradition spanning millennia, affirming their identity as part of the Jewish people.",
    mainSources: "Deuteronomy 3:23–7:11 (Moses pleads, cities of refuge, Shema, V'ahavta, Ten Commandments)",
    classicalCommentary: "The Rambam explains that the command to love God with all your heart, soul, and might (V'ahavta) means that love of God must manifest in studying Torah and living by its commandments. Rashi emphasizes that 'all your might' means even your very life and your financial resources.",
    practicalLesson: "Love for God and Torah must be active and total — with all one's heart (emotions), all one's soul (even in extremity), and all one's resources. The Shema is not just a declaration but a commitment to whole-person devotion.",
    discussionQuestion: "How do you personalize the Shema's call to love God with 'all your heart, soul, and might'? Moses was refused entry to the Land yet transmitted the Torah with full dedication — what does that teach us about legacy versus personal achievement?",
    hebrewQuote: { hebrew: "שְׁמַע יִשְׂרָאֵל יְהוָה אֱלֹהֵינוּ יְהוָה אֶחָד", translation: "Hear O Israel, the Lord is our God, the Lord is One", reference: "Deuteronomy 6:4" },
    sourceReferences: "Deuteronomy 6:4–9, Rashi on Deuteronomy 6:5, Maimonides Hilchot Yesodei HaTorah 2:1, Talmud Berakhot 61b",
  },
  "Bamidbar": {
    keyTheme: "Community, identity, and sacred order. The census of Bamidbar is not a military count but a declaration of each person's infinite worth. Every individual was counted — no one was anonymous before God.",
    didYouKnow: "The Hebrew word for 'desert' (midbar) and 'word/speech' (dibbur) share the same root. The Midrash teaches that the Torah was given in the desert to teach that Torah must be as freely accessible as the open desert — belonging to no one tribe or class exclusively.",
    bneiMenasheConnection: "The Bnei Menashe being counted and recognized as part of the Jewish people through their return and aliyah is a modern-day census moment — each family's name restored to the scroll of Israel.",
    mainSources: "Numbers 1:1–4:20 (census of tribes, Levites set apart), Numbers 2 (tribal arrangement around Tabernacle)",
    classicalCommentary: "The Or HaChaim notes that the census was an expression of divine love — just as we count things that are precious to us. The Sforno explains the tribal arrangement around the Tabernacle as reflecting each tribe's unique spiritual character and contribution.",
    practicalLesson: "Every person counts — literally. The Torah insists on accounting for each individual by name. In a world that reduces people to statistics, we are called to recognize the singular worth of every human being in our communities.",
    discussionQuestion: "The Levites were counted separately and given a distinct sacred role. How does having defined roles and responsibilities strengthen rather than divide a community? What is your unique 'tribe role' in your community?",
    hebrewQuote: { hebrew: "שְׂאוּ אֶת-רֹאשׁ כָּל-עֲדַת בְּנֵי-יִשְׂרָאֵל", translation: "Take a census of the entire Israelite community", reference: "Numbers 1:2" },
    sourceReferences: "Numbers 1:1–2, Rashi on Numbers 1:1, Or HaChaim on Numbers 1:1, Sforno on Numbers 2:2, Talmud Yoma 22b",
  },
  "Beha'alotcha": {
    keyTheme: "Leadership, complaint, and spiritual sustenance. Moses faces the weight of leadership as the people complain about the manna and long for Egypt. God provides quail but also a devastating plague — illustrating the cost of ingratitude.",
    didYouKnow: "The lighting of the Menorah in this parashah is placed after the tribal offerings to teach Aaron that his role — illuminating others — was greater than bringing sacrifices. The Menorah's light, unlike the altar's fire, could never be extinguished.",
    bneiMenasheConnection: "The Bnei Menashe know what it means to 'remember the fish we ate in Egypt' — the comforts of a familiar homeland left behind. Their spiritual journey, like Israel's in the desert, required trading physical comfort for spiritual authenticity.",
    mainSources: "Numbers 8:1–4 (Menorah), Numbers 9:1–14 (second Passover), Numbers 11 (complaints and quail), Numbers 12 (Miriam and Aaron speak against Moses)",
    classicalCommentary: "Rashi on the Menorah notes that Aaron was troubled he didn't participate in the tribal offerings, so God gave him the eternal Menorah service. The Sifri explains that Moses's humility (Numbers 12:3) was the source of his greatness as a leader.",
    practicalLesson: "Gratitude is the antidote to the spirit of complaint. The manna was miraculous — it tasted like whatever one desired — yet the people focused on what they lacked. Practicing gratitude for the miraculous in our daily lives is the foundation of joy.",
    discussionQuestion: "Why is it easier to complain than to be grateful? What practices can help us maintain a spirit of appreciation even when we face genuine hardships? How does Moses's response to Miriam's criticism model handling disloyalty?",
    hebrewQuote: { hebrew: "בְּהַעֲלֹתְךָ אֶת-הַנֵּרֹת אֶל-מוּל פְּנֵי הַמְּנוֹרָה יָאִירוּ שִׁבְעַת הַנֵּרוֹת", translation: "When you kindle the lamps, the seven lamps shall give light toward the face of the Menorah", reference: "Numbers 8:2" },
    sourceReferences: "Numbers 8:2, Rashi on Numbers 8:2, Numbers 11:1, Sifri Bamidbar, Talmud Shabbat 22b",
  },
  "Korach": {
    keyTheme: "The danger of divisive ambition. Korach's rebellion is one of the Torah's great cautionary tales — a gifted, prominent Levite whose ego and jealousy drove him to challenge legitimate authority, dragging hundreds to destruction.",
    didYouKnow: "The Mishnah (Avot 5:17) contrasts two types of controversy: 'a dispute for the sake of Heaven' (like Hillel and Shammai) and 'a dispute not for the sake of Heaven' (like Korach). The former leads to lasting truth; the latter, to disaster.",
    bneiMenasheConnection: "Community building requires unity of purpose. The Bnei Menashe's remarkable story of return has been sustained not by individuals seeking personal glory but by collective commitment to a shared spiritual mission — the opposite of Korach's agenda.",
    mainSources: "Numbers 16:1–35 (the rebellion and its end), Numbers 16:36–17:15 (Aaron's atonement), Numbers 17:16–28 (Aaron's staff blooms)",
    classicalCommentary: "Rashi and the Midrash reveal that Korach's real motivation was envy — he was passed over for a leadership position. The Kli Yakar notes that Korach used the language of equality ('all the congregation is holy') to disguise personal ambition. The Meshech Chochmah observes that Aaron's blooming staff specifically produced almonds — which ripen very quickly — to show that divine appointment is immediate and unmistakable.",
    practicalLesson: "Before challenging authority, examine your motivations ruthlessly. Are you advocating for the community's genuine good, or for your own advancement? Korach's 'principled objection' was rationalization. Authentic leadership serves others.",
    discussionQuestion: "How do we distinguish between legitimate dissent (like Moses courageously arguing with God) and destructive rebellion (like Korach)? What should a community leader do when facing a 'Korach' within their organization?",
    hebrewQuote: { hebrew: "רַב-לָכֶם בְּנֵי לֵוִי", translation: "You have gone too far, sons of Levi", reference: "Numbers 16:7" },
    sourceReferences: "Numbers 16:1, Rashi on Numbers 16:1, Kli Yakar on Numbers 16:3, Mishnah Avot 5:17, Talmud Sanhedrin 110a",
  },
  "Vayeira": {
    keyTheme: "Hospitality, intercession, and the binding of Isaac. Abraham models radical hospitality even while recovering from circumcision. He argues with God to save Sodom. He passes the ultimate test of faith at the Akeidah.",
    didYouKnow: "Abraham ran to greet the three visitors even though he was 99 years old and three days post-circumcision — in pain. The Talmud derives from this that welcoming guests is greater even than receiving the Divine Presence.",
    bneiMenasheConnection: "The Bnei Menashe communities are known for their warmth and hospitality, rooted in the same Torah values Abraham embodied. Their willingness to sacrifice comfort for faith connects them directly to Abraham's journey on Mount Moriah.",
    mainSources: "Genesis 18:1–15 (three visitors), Genesis 18:16–33 (Abraham intercedes for Sodom), Genesis 19 (destruction of Sodom), Genesis 21 (Isaac's birth), Genesis 22 (the Akeidah)",
    classicalCommentary: "Rashi notes that 'the Lord appeared to him' (18:1) was a visit of healing after Abraham's circumcision — teaching us bikkur cholim (visiting the sick). The Ramban on the Akeidah explains that God was not testing to find out what Abraham would do (God already knew) but to actualize Abraham's potential and create a merit for future generations.",
    practicalLesson: "True hospitality means welcoming the stranger without agenda. Abraham didn't know his visitors were angels — he extended full care to unknown travelers. The greatest moments of spiritual encounter often come through simple acts of human kindness.",
    discussionQuestion: "Abraham argued with God to save even wicked Sodom. What does this teach us about the duty to advocate for others, even when they seem beyond saving? How do you balance justice and mercy in your own relationships?",
    hebrewQuote: { hebrew: "הֲשֹׁפֵט כָּל-הָאָרֶץ לֹא יַעֲשֶׂה מִשְׁפָּט", translation: "Shall the Judge of all the earth not do justice?", reference: "Genesis 18:25" },
    sourceReferences: "Genesis 18:1, Rashi on Genesis 18:1, Ramban on Genesis 22:1, Talmud Shabbat 127a, Midrash Rabbah Vayeira 49:6",
  },
  "Ki Tisa": {
    keyTheme: "Sin, repentance, and divine mercy. At the moment Moses receives the Torah, Israel worships the Golden Calf. The parashah traces the full arc of sin, broken relationship, Moses's extraordinary intercession, and God's renewal of the covenant.",
    didYouKnow: "The Thirteen Attributes of Mercy (Exodus 34:6–7) that God reveals to Moses after the Golden Calf have become the cornerstone of Yom Kippur prayers. The Talmud teaches that when Israel recites them, God's mercy is always aroused.",
    bneiMenasheConnection: "The story of the Golden Calf — worshipping an image that felt culturally familiar instead of the invisible God — resonates with any community returning from assimilation. The Bnei Menashe's teshuvah (return) mirrors Israel's renewal after the calf.",
    mainSources: "Exodus 30:11–16 (census/atonement half-shekel), Exodus 32 (Golden Calf), Exodus 33 (God's presence), Exodus 34 (new tablets, Thirteen Attributes)",
    classicalCommentary: "Rashi explains that the people 'erred' in calculating when Moses would return. The Ramban sees the Golden Calf as the original sin of Israel — echoed in the Second Temple's destruction. The Ba'al HaTurim notes that 'ki tisa' (when you take a census) uses the word for 'elevation' — suggesting that even accounting for one's spiritual deficits can elevate.",
    practicalLesson: "The greatest leaders intercede for their community even when it fails them. Moses begged God to forgive Israel even after they betrayed the covenant — not because they deserved it but because of covenant love. This is the model of true pastoral leadership.",
    discussionQuestion: "Moses shattered the first set of tablets — an unprecedented act. Yet the fragments were placed alongside the new tablets in the Ark. What does this teach about how we should treat the 'broken pieces' of our past failures?",
    hebrewQuote: { hebrew: "יְהוָה יְהוָה אֵל רַחוּם וְחַנּוּן אֶרֶךְ אַפַּיִם וְרַב-חֶסֶד וֶאֱמֶת", translation: "The Lord, the Lord, God compassionate and gracious, slow to anger, abounding in loving-kindness and truth", reference: "Exodus 34:6" },
    sourceReferences: "Exodus 34:6–7, Rashi on Exodus 32:1, Ramban on Exodus 32:1, Talmud Rosh Hashanah 17b, Zohar II 86a",
  },
};

// Generate generic insights for parashiyot not explicitly listed
export function getParashaInsights(name: string, book: string, summary: string): ParashaInsights {
  const explicit = PARASHA_INSIGHTS[name];
  if (explicit) return explicit;

  // Generic fallback using the parasha's actual data
  const bookThemes: Record<string, string> = {
    "Bereishit": "the foundations of creation, family, and the origins of the Jewish people",
    "Shemot": "the birth of the Jewish nation, liberation from Egypt, and the revelation of Torah",
    "Vayikra": "the sanctity of the Tabernacle service, purity, and the priestly covenant",
    "Bamidbar": "the desert journey, communal organization, and tests of faith in the wilderness",
    "Devarim": "Moses's farewell teachings, the renewal of the covenant, and preparation for the Promised Land",
  };
  const bookTheme = bookThemes[book] || "the Torah's eternal wisdom";

  return {
    keyTheme: `Parashat ${name} explores ${bookTheme}. The parashah presents timeless principles of Torah living that speak directly to our personal and communal journeys as the Jewish people.`,
    didYouKnow: `The name "${name}" appears as the first significant word or concept in the opening verses of this Torah portion. Sages throughout the generations have found deep meaning in this choice of name, seeing it as a window into the portion's central spiritual message.`,
    bneiMenasheConnection: `The Bnei Menashe community finds in ${name} a personal resonance — the themes of this parashah mirror the journey of return, identity, and covenant that defines the Bnei Menashe experience of coming home to the Jewish people and the Land of Israel.`,
    mainSources: `${book}: primary verses of Parashat ${name}. This parashah draws on both narrative and legal sections that have been foundational to rabbinic discussion throughout the generations.`,
    classicalCommentary: `Rashi's commentary on ${name} highlights the plain meaning of the text while revealing deeper narrative logic. Ramban (Nachmanides) explores the spiritual dimensions and providential significance of the events. Other classical commentators including the Sforno, Or HaChaim, and Kli Yakar each contribute unique perspectives on the parashah's timeless lessons.`,
    practicalLesson: `${name} teaches us that Torah is not merely an ancient text but a living guide. The principles within this portion — whether about relationships, responsibility, faith, or community — speak directly to the challenges we face today. Taking one concrete lesson from this week's parashah and applying it throughout the week is the essence of Torah study.`,
    discussionQuestion: `What is the central challenge that the main figures of Parashat ${name} face, and how can their response guide our own approach to similar challenges today? How does the Bnei Menashe experience of return shed new light on the themes of this parashah?`,
    hebrewQuote: { hebrew: "תּוֹרַת יְהוָה תְּמִימָה מְשִׁיבַת נָפֶשׁ", translation: "The Torah of the Lord is perfect, restoring the soul", reference: "Psalms 19:8" },
    sourceReferences: `${book} (primary text of ${name}), Rashi on ${name}, Ramban on ${name}, Talmudic sources, Midrash Rabbah`,
  };
}

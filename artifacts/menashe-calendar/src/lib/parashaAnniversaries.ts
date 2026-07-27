export interface ParashaAnniversary {
  name: string;
  hebrewName?: string;
  yearCE?: string;
  type: "yahrzeit" | "birthday" | "event";
  description: string;
}

export const PARASHA_ANNIVERSARIES: Record<string, ParashaAnniversary[]> = {
  "Bereshit": [
    {
      name: "Rashi (Rabbi Shlomo Yitzchaki)",
      hebrewName: "רַשִׁ״י",
      yearCE: "1040–1105",
      type: "yahrzeit",
      description: "Rashi's commentary on Bereshit — the very first words of Torah — is the gateway through which virtually every Jewish child enters the Torah. His simple yet profound explanation of 'In the beginning' remains the most studied commentary in Jewish history.",
    },
    {
      name: "First Human Being Created",
      type: "event",
      description: "Bereshit records the creation of Adam and Eve, the first human beings. The Talmud (Sanhedrin 38a) teaches that Adam was created on the 1st of Tishrei — Rosh Hashanah — so that humanity's very first day was a day of judgment and renewal before God.",
    },
  ],
  "Noach": [
    {
      name: "Maimonides (Rambam)",
      hebrewName: "רַמְבַּ\"ם",
      yearCE: "1138–1204",
      type: "yahrzeit",
      description: "The Rambam, whose Mishneh Torah and Guide for the Perplexed shaped all subsequent Jewish philosophy, wrote extensively on Noah's seven universal commandments — the Noachide Laws — as the ethical foundation for all humanity. His Yahrzeit is 20 Tevet.",
    },
    {
      name: "The Great Flood Ends",
      type: "event",
      description: "The Torah records that Noah's ark rested on the mountains of Ararat on the 17th of Nisan — a date the Sages connect to future redemption. The rainbow covenant following the flood became the first divine promise preserved across all generations.",
    },
  ],
  "Lech-Lecha": [
    {
      name: "Rabbi Menachem Mendel of Vitebsk",
      hebrewName: "מנחם מנדל מוויטבסק",
      yearCE: "1730–1788",
      type: "yahrzeit",
      description: "A leading disciple of the Maggid of Mezeritch, Rabbi Menachem Mendel led the first major Chassidic Aliyah to Eretz Israel in 1777 — a living Lech Lecha — with 300 followers. He is buried in Tiberias. His Yahrzeit is 1 Iyar.",
    },
    {
      name: "Covenant of the Parts (Brit Bein HaBetarim)",
      type: "event",
      description: "God sealed the covenant with Abraham at night between divided animals, promising his descendants the Land of Canaan. This first divine covenant with the Jewish people established the eternal bond between Israel and its land — a promise the Bnei Menashe are living today.",
    },
  ],
  "Vayeira": [
    {
      name: "Rabbi Moshe ben Nachman (Ramban)",
      hebrewName: "רַמְבַּ\"ן",
      yearCE: "1194–1270",
      type: "yahrzeit",
      description: "The Ramban's profound commentary on the Akeidah — Abraham's binding of Isaac — explores the theological depths of sacrifice, faith, and divine testing. He made Aliyah to Eretz Israel in his old age, settling in Acre and reviving the Jewish community there. His Yahrzeit is 11 Nisan.",
    },
    {
      name: "The Akeidah — Binding of Isaac",
      type: "event",
      description: "The Akeidah (Genesis 22) is read every Rosh Hashanah morning and is considered the pinnacle of human faith. The shofar we blow on Rosh Hashanah is the ram's horn from this very moment — a sound that echoes across every generation.",
    },
  ],
  "Chayei Sara": [
    {
      name: "Our Matriarch Sarah",
      hebrewName: "שָׂרָה אִמֵּנוּ",
      yearCE: "c. 1803–1676 BCE",
      type: "yahrzeit",
      description: "Sarah died at age 127 as recorded in this Parasha, and Abraham purchased the Cave of Machpelah in Hebron as her burial place. The Sages teach that the three miracles in her tent — the Shabbat candles, the bread, and the cloud of presence — reflected her extraordinary holiness.",
    },
    {
      name: "Cave of Machpelah Purchased",
      type: "event",
      description: "Abraham's purchase of the Cave of Machpelah from Ephron the Hittite for 400 silver shekels is the first recorded real estate transaction in the Torah — and the first Jewish property in the Land of Israel. Abraham, Isaac, Rebecca, Jacob, and Leah are all buried there.",
    },
  ],
  "Toldot": [
    {
      name: "Rabbi Yitzchak Luria (the Arizal)",
      hebrewName: "הָאֲרִ\"זַ\"ל",
      yearCE: "1534–1572",
      type: "yahrzeit",
      description: "The Arizal, the greatest Kabbalist of the last millennium, wrote about the souls of Jacob and Esau as cosmic archetypes — the struggle of holiness and the material world. His Lurianic Kabbalah transformed Jewish mysticism. His Yahrzeit is 5 Av.",
    },
    {
      name: "Isaac Blesses Jacob",
      type: "event",
      description: "The deceptive blessing scene in Toldot contains a hidden lesson: the Sages note that Isaac smelled Jacob's garments and 'smelled the fragrance of his field.' Rashi explains this refers to the fragrance of the Garden of Eden — Jacob carried a spiritual scent of divine origin.",
    },
  ],
  "Vayetzei": [
    {
      name: "Our Matriarch Rachel",
      hebrewName: "רָחֵל אִמֵּנוּ",
      type: "yahrzeit",
      description: "Rachel Imeinu passed away on the 11th of Cheshvan — a date that traditionally falls during or near this Parasha. She is buried in Bethlehem (Kever Rachel), and the Midrash teaches she weeps for her children in every generation. Her tomb is one of the most visited holy sites in the world.",
    },
    {
      name: "Jacob's Ladder Dream",
      type: "event",
      description: "Jacob's dream of a ladder ascending to heaven, with angels going up and down, occurred at the site of the future Temple in Jerusalem (Beit El). The Sages teach this vision revealed the cosmic structure connecting heaven and earth — and the eternal promise that God will bring Jacob's descendants home.",
    },
  ],
  "Vayishlach": [
    {
      name: "Rabbi Moshe Isserles (the Rema)",
      hebrewName: "הָרֵמ\"א",
      yearCE: "1520–1572",
      type: "yahrzeit",
      description: "The Rema's glosses on the Shulchan Aruch became the definitive code of law for Ashkenazic Jewry. He wrote about Jacob's wrestling with the angel as a paradigm for the Jewish people's struggle through exile and their ultimate triumph. His Yahrzeit is 18 Iyar.",
    },
    {
      name: "Jacob Renamed Israel",
      type: "event",
      description: "After wrestling with the angel through the night, Jacob was renamed Israel — 'one who strives with God and prevails.' The Sages teach this was a prophetic name for the entire Jewish nation. The sinew (gid ha'nasheh) that Jews do not eat commemorates this encounter.",
    },
  ],
  "Vayeshev": [
    {
      name: "Rabbi Yosef Karo",
      hebrewName: "מָרַן",
      yearCE: "1488–1575",
      type: "yahrzeit",
      description: "Rabbi Yosef Karo, author of the Shulchan Aruch (Code of Jewish Law), was named after the Joseph of the Torah — a connection he felt deeply. He was guided by a heavenly mentor (Maggid) and made Aliyah to Safed, where he transformed Jewish legal scholarship. His Yahrzeit is 13 Nisan.",
    },
    {
      name: "Joseph Sold into Egypt",
      type: "event",
      description: "The Midrash teaches that Joseph was sold to Egypt on Rosh Hashana. His descent was a divine setup for future salvation — what his brothers intended as evil, God intended for good (Genesis 50:20). This is one of the Torah's greatest lessons about divine providence working through human suffering.",
    },
  ],
  "Miketz": [
    {
      name: "Chanukah — Festival of Lights",
      type: "event",
      description: "Parashat Miketz almost always coincides with Chanukah. Just as Joseph went from the pit of a dungeon to the palace in a single day through divine providence, the Maccabees experienced a sudden reversal of fortune. Both stories teach that darkness does not extinguish God's light.",
    },
    {
      name: "Rabbi Bachya ibn Pakuda",
      hebrewName: "רַבֵּינוּ בַּחְיָא",
      yearCE: "c. 1050–1120",
      type: "yahrzeit",
      description: "Author of the classic ethical work 'Duties of the Heart' (Chovot HaLevavot), Rabbi Bachya wrote about the spiritual quality of Joseph — particularly the inner trust and bitachon (faith) Joseph displayed in prison. His work remains one of the most beloved books of Jewish ethics.",
    },
  ],
  "Vayigash": [
    {
      name: "Rabbi Yehuda Aryeh Leib Alter (Sfat Emet)",
      hebrewName: "שְׂפַת אֱמֶת",
      yearCE: "1847–1905",
      type: "yahrzeit",
      description: "The Sfat Emet of Ger wrote an extraordinary collection on Vayigash, exploring Judah's transformation from the brother who sold Joseph to the one who offers himself as a slave for Benjamin. He saw this as the essence of teshuvah — complete transformation. His Yahrzeit is 5 Shevat.",
    },
    {
      name: "Joseph Reveals Himself",
      type: "event",
      description: "Joseph's dramatic self-revelation to his brothers — 'I am Joseph, is my father still alive?' — caused such shock the brothers could not speak. The Midrash uses this moment as a metaphor for the final redemption, when God's presence will be revealed and all will stand in awe.",
    },
  ],
  "Vayechi": [
    {
      name: "Jacob Aveinu",
      hebrewName: "יַעֲקֹב אָבִינוּ",
      type: "yahrzeit",
      description: "Jacob Aveinu is traditionally said to have passed away on 28 Tevet — a date that can fall near this Parasha's reading. The Torah says 'Jacob died' was never written — only 'Jacob ceased breathing' — because the Sages teach the righteous never truly die, they live on through their descendants.",
    },
    {
      name: "Jacob Blesses the Twelve Tribes",
      type: "event",
      description: "Jacob's final blessings to his twelve sons form the prophetic foundation for the twelve tribes of Israel. The blessing 'Gather yourselves and I will tell you what will happen at the End of Days' (49:1) is one of the Torah's most studied passages — the Sages say the End of Days was hidden from Jacob at that moment.",
    },
  ],
  "Shemot": [
    {
      name: "Moses Rabbeinu",
      hebrewName: "מֹשֶׁה רַבֵּינוּ",
      type: "birthday",
      description: "Moses was born on 7 Adar — a date that also became his Yahrzeit 120 years later. The Sages teach that his birth and death on the same date was divinely intentional. Moses, whose birth is recorded in this Parasha, is the greatest prophet who ever lived and will ever live.",
    },
    {
      name: "The Burning Bush",
      type: "event",
      description: "The Burning Bush revelation at Horeb (Sinai) — where Moses encountered God for the first time — is traditionally located on 7 Adar or around that time. The bush that burned but was not consumed became the eternal symbol of the Jewish people: persecuted but indestructible.",
    },
  ],
  "Vaeira": [
    {
      name: "The Ten Plagues Begin",
      type: "event",
      description: "The first seven plagues — beginning with blood — commenced after Moses and Aaron's first confrontations with Pharaoh. Tradition dates the beginning of the plagues to the Hebrew month of Av, nine months before the Exodus. Each plague was precisely calibrated to refute an Egyptian deity.",
    },
    {
      name: "Rabbi Ovadiah Yosef",
      hebrewName: "רַב עֹבַדְיָה יוֹסֵף",
      yearCE: "1920–2013",
      type: "yahrzeit",
      description: "The Sephardic posek ha'dor (decisor of the generation) who revolutionized Halachic rulings for Sephardic Jews worldwide and was a tireless advocate for Yemenite and Sephardic communities. He ruled definitively that the Bnei Menashe are descendants of the tribe of Menashe and should be brought home to Israel. His Yahrzeit is 3 Cheshvan.",
    },
  ],
  "Bo": [
    {
      name: "The Exodus from Egypt",
      type: "event",
      description: "The Exodus occurred on the 15th of Nisan, but the final plagues — including the death of the firstborn on the 15th of Nisan — are in Parashat Bo. The Passover sacrifice, first performed in Egypt, was the first communal commandment given to the Jewish people as a nation.",
    },
    {
      name: "Rabbi Shimon bar Yochai",
      hebrewName: "רַשְׁבִּ\"י",
      yearCE: "c. 80–160 CE",
      type: "yahrzeit",
      description: "Author of the Zohar and the greatest mystic of the Talmudic era. Rabbi Shimon taught that the plagues of Egypt were spiritual forces, not merely physical events. His Yahrzeit on 18 Iyar (Lag B'Omer) is celebrated worldwide with bonfires, particularly in Meron, Israel.",
    },
  ],
  "Beshalach": [
    {
      name: "Miriam the Prophetess",
      hebrewName: "מִרְיָם הַנְּבִיאָה",
      type: "birthday",
      description: "Miriam, Moses's sister, led the women of Israel in song and dance after the splitting of the Red Sea. The Sages attribute the miraculous well that accompanied Israel in the desert (the Well of Miriam) to her merit. Her courage in saving the infant Moses and her leadership at the sea mark her as one of the greatest women in Jewish history.",
    },
    {
      name: "Splitting of the Red Sea",
      type: "event",
      description: "The sea split on the 21st of Nisan — the last day of Passover. The Sages teach that the sea actually split before the Israelites entered it, only after Nachshon ben Aminadav walked in up to his nostrils in faith. This is the paradigm of 'jump and the net will appear.'",
    },
  ],
  "Yitro": [
    {
      name: "Revelation at Sinai — Ten Commandments",
      type: "event",
      description: "The Torah was given on 6 Sivan — Shavuot. But the Sinai experience described in Yitro was preceded by three days of preparation (3–5 Sivan). The Sages teach that God offered the Torah to every nation, and only Israel said 'na'aseh v'nishma' — 'we will do and we will hear' — accepting it unconditionally.",
    },
    {
      name: "Jethro (Yitro)",
      hebrewName: "יִתְרוֹ",
      type: "event",
      description: "Jethro, Moses's Midianite father-in-law, converted to Judaism after witnessing the Exodus and became the paradigm of the righteous convert. The Sages teach that his advice on judicial delegation (Exodus 18) was so wise it merited an entire Parasha named after him — one of the highest honors in the Torah.",
    },
  ],
  "Mishpatim": [
    {
      name: "Rabbi Yishmael",
      hebrewName: "רַבִּי יִשְׁמָעֵאל",
      yearCE: "c. 80–135 CE",
      type: "yahrzeit",
      description: "One of the great Tannaim and author of the 13 hermeneutical principles for Torah interpretation. Rabbi Yishmael's school produced the halachic midrashim on Shemot (Mekhilta) which are the primary commentary on Mishpatim. He was martyred by the Romans and is counted among the Ten Martyrs.",
    },
    {
      name: "Na'aseh V'Nishma — 'We Will Do and Hear'",
      type: "event",
      description: "At the conclusion of Mishpatim, the Israelites famously declared 'na'aseh v'nishma' — 'we will do and we will hear' — accepting the Torah before even knowing its contents. The Talmud (Shabbat 88a) says 600,000 angels came and placed two crowns on each Israelite's head at that moment.",
    },
  ],
  "Terumah": [
    {
      name: "Bezalel ben Uri",
      hebrewName: "בְּצַלְאֵל בֶּן אוּרִי",
      type: "event",
      description: "Bezalel, appointed chief artisan of the Tabernacle, was only 13 years old when he was chosen — yet so wise that he understood the mystical combinations of letters through which God created the world. His name means 'In the shadow of God,' and the Sages say his artistry was divinely inspired.",
    },
    {
      name: "The Ark of the Covenant",
      type: "event",
      description: "The Holy Ark, described in detail in Terumah, contained the two Tablets of the Law — and according to some authorities, also the broken first tablets. The Sages teach that the Ark 'carried its carriers'; those who bore it did not carry it — it carried them. Its location remains one of history's greatest mysteries.",
    },
  ],
  "Tetzaveh": [
    {
      name: "Aaron HaKohen",
      hebrewName: "אַהֲרֹן הַכֹּהֵן",
      type: "event",
      description: "Tetzaveh is the only Parasha from Shemot to Devarim where Moses's name does not appear — because of Moses's statement 'erase me from Your book' (Exodus 32:32). Aaron, the subject of this Parasha, was the first Kohen Gadol and is described as 'loving peace and pursuing peace, loving people and drawing them close to Torah.'",
    },
    {
      name: "The Urim and Thummim",
      type: "event",
      description: "The High Priest's breastplate containing twelve precious stones (one for each tribe) also held the mysterious Urim and Thummim — a divine oracle through which God communicated answers to national questions. The Talmud (Yoma 73b) records detailed accounts of how it worked. Its use ceased with the Babylonian exile.",
    },
  ],
  "Ki Tisa": [
    {
      name: "Moses Breaks the Tablets",
      type: "event",
      description: "Moses descended Sinai on 17 Tammuz — the date that became a fast day for Jewish history. He broke the tablets upon seeing the Golden Calf. The Sages note that God agreed with this act: 'You did well to break them.' The broken tablets were placed in the Ark alongside the whole second tablets.",
    },
    {
      name: "Rabbi Eliezer ben Hyrcanus",
      hebrewName: "רַבִּי אֱלִיעֶזֶר",
      yearCE: "c. 50–130 CE",
      type: "yahrzeit",
      description: "One of the greatest Tannaim, Rabbi Eliezer wrote about Moses's intercession after the Golden Calf as the ultimate model of prayer — when God was 'moved' by Moses's words. The Talmud says that 'if all the seas were ink, Rabbi Eliezer's wisdom could not be written down.' His Yahrzeit is 16 Adar.",
    },
  ],
  "Vayakhel": [
    {
      name: "Shabbat Proclaimed Before the Tabernacle",
      type: "event",
      description: "Vayakhel opens with Moses gathering all Israel and proclaiming the laws of Shabbat — before giving Tabernacle instructions. The Sages explain the order teaches that Shabbat takes precedence even over building the Tabernacle. The 39 categories of forbidden Shabbat labor are derived from the Tabernacle's construction activities.",
    },
    {
      name: "Rabbi Yehuda HaNasi (Rebbe)",
      hebrewName: "רַבִּי יְהוּדָה הַנָּשִׂיא",
      yearCE: "135–217 CE",
      type: "yahrzeit",
      description: "Compiler of the Mishnah and the greatest leader of his generation, Rabbi Yehuda HaNasi is called simply 'Rebbe.' He lived on 2 Adar and died on the same date 70 years later. He taught that one who performs even a single Mitzvah with joy merits divine reward — a lesson embodied in the Tabernacle's willing-hearted donors.",
    },
  ],
  "Pekudei": [
    {
      name: "The Tabernacle Completed",
      type: "event",
      description: "The Tabernacle was completed and erected on the 1st of Nisan — the first Rosh Chodesh of the first year after the Exodus. The Sages teach that this was the happiest day in Israel's history until that point; ten crowns descended upon that day. The cloud of glory immediately filled it, confirming divine approval.",
    },
    {
      name: "Rabbi Moshe Chaim Luzzatto (Ramchal)",
      hebrewName: "רַמְחַ\"ל",
      yearCE: "1707–1746",
      type: "yahrzeit",
      description: "Author of Mesillat Yesharim (Path of the Just) — one of the most beloved Jewish ethical works ever written. The Ramchal wrote about the Tabernacle as a microcosm of the divine world, and his mystical-ethical works combined Kabbalah with practical character development. He died in Acre, Israel, on 26 Iyar.",
    },
  ],
  "Vayikra": [
    {
      name: "Rabbi Yochanan ben Zakkai",
      hebrewName: "רַבָּן יוֹחָנָן בֶּן זַכַּאי",
      yearCE: "c. 30 BCE–90 CE",
      type: "yahrzeit",
      description: "After the Temple's destruction, Rabbi Yochanan ben Zakkai brilliantly substituted prayer, charity, and Torah study for the Temple sacrifices described in Vayikra — saving Judaism. His famous request to Emperor Vespasian for 'Yavneh and its sages' ensured Jewish continuity through the darkest hours of exile.",
    },
    {
      name: "The Sacrificial System Instituted",
      type: "event",
      description: "Vayikra (Leviticus) opens with God calling to Moses in a small, humble voice (kol demama daka). Rashi notes the Hebrew word 'vayikra' has a small letter Aleph — to teach that even a great person like Moses should approach God with humility. The entire sacrificial system was ultimately about drawing near to God.",
    },
  ],
  "Tzav": [
    {
      name: "Aaron and Sons Ordained as Kohanim",
      type: "event",
      description: "The seven-day ordination ceremony for Aaron and his sons (Millu'im) is described in Tzav. The Midrash teaches that Moses performed all priestly duties during those seven days — the only week in history when Moses served as Kohen Gadol. On the eighth day, Aaron took over the permanent role.",
    },
    {
      name: "The Eternal Flame",
      type: "event",
      description: "Tzav commands: 'A fire shall burn continuously on the altar; it shall not go out' (6:6). The Sages teach this refers both to the physical flame and to the inner fire of devotion that every Jew must maintain. Rabbi Kook wrote that the 'fire that never goes out' is the Jewish soul's inextinguishable connection to God.",
    },
  ],
  "Shemini": [
    {
      name: "Nadab and Abihu",
      hebrewName: "נָדָב וַאֲבִיהוּא",
      type: "event",
      description: "The deaths of Aaron's sons Nadab and Abihu on the day the Tabernacle was inaugurated is one of the Torah's most puzzling passages. The Sages offer many interpretations of their sin. Aaron's silent response — 'vayidom Aharon' (Aaron was silent) — became the paradigm of accepting divine judgment with complete faith.",
    },
    {
      name: "The Laws of Kashrut Introduced",
      type: "event",
      description: "Shemini contains the first comprehensive list of kosher and non-kosher animals. The Sages teach that the laws of Kashrut were given 'to refine the soul' — not for health reasons. Maimonides notes that eating forbidden foods was believed to cause spiritual insensitivity.",
    },
  ],
  "Tazria": [
    {
      name: "Brit Milah — Covenant of Circumcision",
      type: "event",
      description: "Tazria begins with the laws of childbirth and mentions brit milah on the eighth day. The Talmud (Niddah 31b) explains why the brit is on the eighth day: so that at least one Shabbat passes before it, ensuring the child has experienced the holiest day. The covenant of circumcision is described as equal to all other commandments combined.",
    },
    {
      name: "Rabbi Akiva",
      hebrewName: "רַבִּי עֲקִיבָא",
      yearCE: "c. 50–135 CE",
      type: "yahrzeit",
      description: "The greatest sage of the Mishnaic era who began learning Torah at age 40. Rabbi Akiva declared 'Love your neighbor as yourself' the most important verse in the Torah. He was martyred during the Roman persecutions and died with the Shema on his lips. His Yahrzeit is around the period of the Omer, which begins near Tazria.",
    },
  ],
  "Metzora": [
    {
      name: "The Purification Process",
      type: "event",
      description: "The elaborate purification ritual for the metzora — involving two birds, cedar wood, crimson thread, and hyssop — is one of the Torah's most symbolically rich passages. Rabbi Samson Raphael Hirsch wrote a detailed symbolic analysis: the cedar (pride) paired with the hyssop (humility) teaches that the cure for lashon hara (slander) begins with becoming humble.",
    },
    {
      name: "The Four Lepers at the Gate (II Kings 7)",
      type: "event",
      description: "The haftarah for Metzora tells of four lepers who discovered the Aramean army had fled Samaria in a miraculous rout. The Sages identify these four lepers as Gehazi and his three sons — who were afflicted with tzara'at for greed. Their accidental heroism saved Israel, teaching that divine providence works through unexpected vessels.",
    },
  ],
  "Acharei Mot": [
    {
      name: "The Yom Kippur Service",
      type: "event",
      description: "Acharei Mot contains the complete description of the Yom Kippur Temple service — the only day the Kohen Gadol entered the Holy of Holies. The Mishnah (Yoma) records that the entire nation trembled as the Kohen Gadol entered, and rejoiced if he emerged safely. The lottery between two goats — one for God, one for Azazel — is one of the Torah's most mysterious rituals.",
    },
    {
      name: "Rabbi Yisrael Ba'al Shem Tov (the Besht)",
      hebrewName: "הַבַּעַל שֵׁם טוֹב",
      yearCE: "1698–1760",
      type: "yahrzeit",
      description: "Founder of Chassidic Judaism, the Ba'al Shem Tov revolutionized Jewish spirituality by teaching that sincere prayer and joy in God's presence were accessible to every Jew — not just scholars. He died on Shavuot 1760, having told his students: 'I will go through one door and enter through another.' His yahrzeit is 6 Sivan.",
    },
  ],
  "Kedoshim": [
    {
      name: "'Love Your Neighbor as Yourself' Proclaimed",
      type: "event",
      description: "Parashat Kedoshim contains what Rabbi Akiva called the 'great principle of the Torah' — 'Love your neighbor as yourself' (Leviticus 19:18). The Talmud teaches Ben Azzai went further, saying 'This is the book of the generations of Man' (Genesis 5:1) is even greater — because it establishes the equal divine image in every human being.",
    },
    {
      name: "Rabbi Samson Raphael Hirsch",
      hebrewName: "שמשון רפאל הירש",
      yearCE: "1808–1888",
      type: "yahrzeit",
      description: "The great Torah commentator and founder of Neo-Orthodoxy who wrote the most detailed English-language commentary on Kedoshim's ethical laws. He argued passionately that Torah observance and modern civilization were not only compatible but mutually reinforcing. His Yahrzeit is 27 Tevet.",
    },
  ],
  "Emor": [
    {
      name: "Rabbi Shimon bar Yochai — Lag B'Omer",
      hebrewName: "רַשְׁבִּ\"י",
      yearCE: "c. 80–160 CE",
      type: "yahrzeit",
      description: "Lag B'Omer (18 Iyar) — the Yahrzeit of Rabbi Shimon bar Yochai — falls during the Omer period counted in Parashat Emor. The Zohar records that on the day of his death, Rabbi Shimon revealed the deepest secrets of Torah, and the house was filled with fire. Bonfires worldwide celebrate his light.",
    },
    {
      name: "The Jewish Festival Calendar Proclaimed",
      type: "event",
      description: "Emor contains the complete calendar of Jewish holidays — Shabbat, Passover, Shavuot, Rosh Hashanah, Yom Kippur, Sukkot, and Shemini Atzeret — all in one passage. The Sages call these 'mo'adim' (appointed times), teaching that the entire Jewish calendar is structured as encounters with the divine.",
    },
  ],
  "Behar": [
    {
      name: "The Jubilee Year",
      type: "event",
      description: "The Jubilee (Yovel) every fifty years — when all land returns to its original tribal owners and Hebrew slaves go free — is one of history's first recorded visions of economic justice and social renewal. The famous phrase inscribed on the Liberty Bell ('Proclaim liberty throughout the land') comes directly from Behar (Leviticus 25:10).",
    },
    {
      name: "Rabbi Levi Yitzchak of Berditchev",
      hebrewName: "רַבִּי לֵוִי יִצְחָק מִבֶּרְדִּיצֶ'וֹב",
      yearCE: "1740–1809",
      type: "yahrzeit",
      description: "The great Chassidic master who was known as the 'Defense Attorney of the Jewish People' — always finding merit in every Jew before God. He wrote about Shemitah (the sabbatical year) as demonstrating absolute faith in divine provision. His Yahrzeit is 25 Tishrei.",
    },
  ],
  "Bechukotai": [
    {
      name: "The Blessings and the Tochacha",
      type: "event",
      description: "The Tochacha (rebuke) of Bechukotai is traditionally read quietly and rapidly in the synagogue — yet the Sages say 'the curses of Bechukotai are actually blessings in disguise' because they promise Israel will survive all suffering and ultimately be redeemed. The final verses promise: 'I will remember My covenant with Jacob.'",
    },
    {
      name: "Rabbi Shlomo Carlebach",
      hebrewName: "רַבִּי שְׁלֹמֹה קַרְלֵבַּך",
      yearCE: "1925–1994",
      type: "yahrzeit",
      description: "The 'singing rabbi' who brought thousands of lost Jews back to their heritage through music and love. His melodies for Shabbat prayers — particularly 'L'cha Dodi' and 'Am Yisrael Chai' — are sung worldwide. He embodied the promise of Bechukotai: that after all suffering, the Jewish people will return and be renewed. His Yahrzeit is 16 Cheshvan.",
    },
  ],
  "Bamidbar": [
    {
      name: "Census of the Twelve Tribes",
      type: "event",
      description: "The census of 603,550 adult men in Bamidbar reflects God counting His people with love — 'each one counted by name.' The Sages note that God counts Israel in the way a person counts their most beloved possessions. The Levites were counted separately, from one month old, because they were dedicated entirely to divine service.",
    },
    {
      name: "Rabbi Shmuel Mohilever",
      hebrewName: "רַבִּי שְׁמוּאֵל מוֹהִילֵיבֶר",
      yearCE: "1824–1898",
      type: "yahrzeit",
      description: "One of the founders of the Mizrachi (religious Zionist) movement, Rabbi Mohilever saw the ingathering of Israel — like the census of Bamidbar — as a holy enterprise. He was among the first rabbis to actively support Jewish agricultural settlements in the Land of Israel. His Yahrzeit is 23 Av.",
    },
  ],
  "Nasso": [
    {
      name: "The Priestly Blessing Given",
      type: "event",
      description: "The Birkat Kohanim (Priestly Blessing) in Nasso — 'May God bless you and protect you; may God shine His face toward you and be gracious to you; may God lift His face to you and give you peace' — is the oldest complete biblical text ever discovered (on a silver amulet from 7th century BCE Jerusalem). These words have blessed Jewish children for three thousand years.",
    },
    {
      name: "Rabbi Yisrael Meir Kagan (the Chofetz Chaim)",
      hebrewName: "חָפֵץ חַיִּים",
      yearCE: "1838–1933",
      type: "yahrzeit",
      description: "The great Kohen who wrote the foundational work on lashon hara (forbidden speech), 'Chofetz Chaim.' As a Kohen, he felt the Birkat Kohanim as his personal calling and obligation. He also wrote the Mishnah Berurah, the definitive halachic code for Ashkenazic Jews. His Yahrzeit is 24 Elul.",
    },
  ],
  "Beha'alotcha": [
    {
      name: "The Menorah Kindled by Aaron",
      type: "event",
      description: "The word 'beha'alotcha' (when you kindle) implies the Kohen must ensure the flame 'rises on its own' — Aaron must encourage the flame until it burns independently. The Zohar teaches this is a metaphor for spiritual leadership: the true leader's goal is to ignite independent light in each student's soul.",
    },
    {
      name: "Rabbi Abraham Isaac Kook (Rav Kook)",
      hebrewName: "הָרַב קוּק",
      yearCE: "1865–1935",
      type: "yahrzeit",
      description: "The first Chief Rabbi of pre-state Israel, Rav Kook was a towering mystic, philosopher, and Zionist visionary. He wrote that the Jewish people's return to Israel was the beginning of divine redemption — the 'kindling' of the national menorah. His Yahrzeit is 3 Elul.",
    },
  ],
  "Shelach": [
    {
      name: "The Twelve Spies Sent — 29 Sivan",
      type: "event",
      description: "The spies were sent on 29 Sivan and returned on 9 Av — the day their negative report caused the people to weep, sealing that date as a day of tragedy for all generations. The Midrash says God told them: 'You cried without reason; I will give you reason to cry on this day for all generations.' This is why 9 Av became the date of both Temple destructions.",
    },
    {
      name: "Caleb ben Yefuneh",
      hebrewName: "כָּלֵב בֶּן יְפֻנֶּה",
      type: "event",
      description: "Caleb, who alone with Joshua gave a faithful spy report, went to pray at the Cave of Machpelah in Hebron for strength to resist the other spies' influence. Because of his faithfulness, God promised him specifically the area of Hebron as his inheritance — the very site where he prayed. Caleb's prayer in the ancestral burial site is a model of seeking strength from one's roots.",
    },
  ],
  "Korach": [
    {
      name: "Korach's Rebellion",
      type: "event",
      description: "The Torah records that Korach's rebellion — gathering 250 leaders against Moses — occurred on 14-15 Nisan (Passover eve) according to some Sages, or around Sivan. The earth miraculously swallowed Korach and his followers. The Sages teach that Korach was immensely learned but allowed jealousy to corrupt his wisdom — 'his wisdom was his downfall.'",
    },
    {
      name: "Rabbi Menachem Mendel Schneerson (the Lubavitcher Rebbe)",
      hebrewName: "הָרֶבֶּה מִלּוּבַּאוִויטש",
      yearCE: "1902–1994",
      type: "yahrzeit",
      description: "The seventh Lubavitcher Rebbe, one of the most influential Jewish leaders of the 20th century. He launched thousands of Chabad houses worldwide, emphasized reaching every Jew regardless of background — the opposite of Korach's elitism — and was a major advocate for the Bnei Menashe's recognition. His Yahrzeit is 3 Tammuz.",
    },
  ],
  "Chukat": [
    {
      name: "Miriam Passes Away — 10 Tammuz",
      hebrewName: "מִרְיָם הַנְּבִיאָה",
      type: "event",
      description: "Miriam the Prophetess died on 10 Tammuz. Immediately after her death, the Torah records that the people had no water — because the miraculous 'Well of Miriam' that had followed Israel through the desert ceased. The juxtaposition teaches that Miriam's merit had sustained the nation's water supply throughout the forty years.",
    },
    {
      name: "Aaron HaKohen Passes Away — 1 Av",
      type: "event",
      description: "Aaron the High Priest died on the 1st of Av at the peak of Mount Hor. The Sages teach that Aaron saw his own death coming peacefully — Moses told him to remove his priestly garments one by one, passing them to his son Elazar, until Aaron stood in his plain linen and lay down. All Israel wept for Aaron for 30 days — even more than for Moses — because Aaron had made peace between every person.",
    },
  ],
  "Balak": [
    {
      name: "Balaam's Oracles",
      type: "event",
      description: "Balaam, hired to curse Israel, found every word transformed into a blessing by God. His most famous prophecy — 'How goodly are your tents, O Jacob, your dwelling places, O Israel' (24:5) — became the verse recited upon entering a synagogue. The Sages teach that Balaam was the greatest prophet ever given to the gentile nations — so that no nation could claim Israel had an unfair advantage.",
    },
    {
      name: "Rabbi Meir Ba'al HaNes",
      hebrewName: "רַבִּי מֵאִיר בַּעַל הַנֵּס",
      yearCE: "c. 110–165 CE",
      type: "yahrzeit",
      description: "One of the greatest Tannaim, student of both Rabbi Akiva and the apostate Acher. Known as 'Ba'al HaNes' (miracle master) because of the many miracles attributed to him. He and his wife Beruriah (one of the greatest women scholars in Talmudic history) lived in Tiberias. His Yahrzeit is 14 Iyar (Pesach Sheni).",
    },
  ],
  "Pinchas": [
    {
      name: "Zelophehad's Daughters",
      type: "event",
      description: "The five daughters of Zelophehad — Mahlah, Noah, Hoglah, Milcah, and Tirzah — courageously approached Moses with a legal argument for their inheritance right. God told Moses: 'The daughters of Zelophehad speak correctly.' The Talmud honors them as wiser than Moses in this instance — one of Torah's great models of women's legal advocacy.",
    },
    {
      name: "Rabbi Yosef Karo",
      hebrewName: "מָרַן",
      yearCE: "1488–1575",
      type: "yahrzeit",
      description: "Author of the Beit Yosef and Shulchan Aruch — the authoritative code of Jewish law. He was also a great mystic guided by a heavenly Maggid. Like Pinchas who received a covenant of eternal priesthood, Rabbi Karo's Shulchan Aruch gave the Jewish people an eternal covenant of legal clarity. His Yahrzeit is 13 Nisan.",
    },
  ],
  "Matot": [
    {
      name: "Laws of Vows and Oaths",
      type: "event",
      description: "Matot opens with the laws of nedarim (vows) and shevuot (oaths) — words have binding power. The Sages teach: 'Make your mouth and your heart equal' — only commit to what you will do, and do what you commit to. The Talmud (Nedarim) discusses these laws exhaustively, emphasizing that even casual speech carries moral weight.",
    },
    {
      name: "Rabbi Elazar ben Azariah",
      hebrewName: "רַבִּי אֶלְעָזָר בֶּן עֲזַרְיָה",
      yearCE: "c. 70–135 CE",
      type: "yahrzeit",
      description: "Appointed Nasi (leader) of the Sanhedrin at age 18, he said: 'I am like a seventy-year-old' because his beard miraculously turned white overnight. He is famous for the statement: 'If there is no Torah, there is no derech eretz (proper conduct); if there is no derech eretz, there is no Torah' — a perfect balance of learning and action reflected in Matot's tribe-city laws.",
    },
  ],
  "Masei": [
    {
      name: "The 42 Journeys of Israel",
      type: "event",
      description: "The 42 stations of the Israelites' journey through the desert are listed in Masei. The Baal Shem Tov taught that these 42 journeys are mirrored in every Jewish soul's life journey — the ups and downs, the stops and starts, are all part of the divine itinerary. The final journey always leads to the Promised Land.",
    },
    {
      name: "Cities of Refuge Established",
      type: "event",
      description: "The six Cities of Refuge (Arei Miklat) — where accidental killers could find sanctuary from blood vengeance — are detailed in Masei. The Sages note that the roads to these cities were kept wide and well-marked. The Alter of Kelm wrote that this teaches: the path to repentance (the ultimate refuge) must always be kept clear and accessible.",
    },
  ],
  "Devarim": [
    {
      name: "Tisha B'Av — The Great Mourning",
      type: "event",
      description: "Parashat Devarim is always read on the Shabbat immediately before Tisha B'Av (9 Av) — the saddest day in the Jewish calendar, marking both Temple destructions. Isaiah's rebuke in the haftarah ('Chazon Yeshayahu') is the harshest prophetic vision in the Bible. The Sages say Tisha B'Av will ultimately become the greatest Jewish holiday of all time.",
    },
    {
      name: "Moses Begins His Farewell Addresses",
      type: "event",
      description: "On 1 Shevat, forty years to the day after leaving Egypt, Moses began his final month of teaching — the entire book of Devarim. He repeated much of the Torah 'in seventy languages' so all nations could learn it. The Sages teach that Moses composed the book of Devarim through divine inspiration on the same level as all other Torah books.",
    },
  ],
  "Va'etchanan": [
    {
      name: "The Shema Proclaimed",
      type: "event",
      description: "Va'etchanan contains the Shema — 'Hear O Israel, the Lord is our God, the Lord is One' (Deuteronomy 6:4) — the central declaration of Jewish faith, recited twice daily and at the moment of death. The Talmud records that when Rabbi Akiva was martyred, he prolonged the word 'echad' (One) until his soul departed, demonstrating that the Shema is the ultimate statement of Jewish life.",
    },
    {
      name: "Shabbat Nachamu — Comfort After Destruction",
      type: "event",
      description: "Va'etchanan is always read on 'Shabbat Nachamu' — the first of seven Shabbatot of consolation after Tisha B'Av. The haftarah opens with 'Nachamu, nachamu ami' — 'Comfort, comfort My people.' The double language of comfort, the Sages teach, reflects both Temples' destruction — and promises double consolation in return.",
    },
  ],
  "Eikev": [
    {
      name: "Rabbi Nachman of Breslov",
      hebrewName: "רַבִּי נַחְמָן מִבְּרֶסְלֶב",
      yearCE: "1772–1810",
      type: "yahrzeit",
      description: "Rebbe Nachman, great-grandson of the Ba'al Shem Tov, was the master of stories, paradoxes, and radical faith. His teaching 'The entire world is a narrow bridge, and the main thing is not to be afraid at all' captures the spirit of Eikev's call to walk in God's ways without fear. His Yahrzeit is 18 Tishrei (Chol HaMo'ed Sukkot).",
    },
    {
      name: "The Second Tablets Carved",
      type: "event",
      description: "Eikev records Moses carving the second set of stone tablets himself — unlike the first tablets which were entirely divine work. The Sages teach that 'the breaking of the first tablets atoned for the Golden Calf.' The Talmud (Bava Batra 14b) states both the broken tablets and the whole ones were placed in the Ark — because every broken soul still has a place in God's presence.",
    },
  ],
  "Re'eh": [
    {
      name: "Jerusalem Chosen as the Eternal Capital",
      type: "event",
      description: "Re'eh introduces the concept of 'the place that God will choose' — the Sages identify this as Jerusalem and specifically the Temple Mount. The prohibition against sacrificing anywhere else established Jerusalem as the eternal spiritual center of Jewish life. The verse 'You shall seek out His dwelling and come there' has guided Jewish prayer toward Jerusalem for three thousand years.",
    },
    {
      name: "Rabbi Chaim of Volozhin",
      hebrewName: "רַבִּי חַיִּים מִוּוֹלוֹזִ'ין",
      yearCE: "1749–1821",
      type: "yahrzeit",
      description: "The greatest student of the Vilna Gaon and founder of the Volozhin Yeshiva — the model for all modern yeshivot. His work 'Nefesh HaChaim' explores the mystical meaning of Torah study as sustaining the entire universe — a concept rooted in Re'eh's centralization of divine service. His Yahrzeit is 14 Sivan.",
    },
  ],
  "Shoftim": [
    {
      name: "'Justice, Justice You Shall Pursue'",
      type: "event",
      description: "Deuteronomy 16:20 — 'Tzedek tzedek tirdof' — 'Justice, justice you shall pursue' is one of the Torah's most quoted verses. The double 'justice' teaches: pursue justice even in how you pursue justice — the means must match the ends. This verse grounds the Jewish commitment to law, courts, and ethical governance described throughout Shoftim.",
    },
    {
      name: "The Vilna Gaon (Rabbi Eliyahu of Vilna)",
      hebrewName: "הַגְּאוֹן מִוִּילְנָה",
      yearCE: "1720–1797",
      type: "yahrzeit",
      description: "The greatest Talmudic genius of the last 300 years, the Vilna Gaon wrote commentaries on virtually all of Torah and Talmud. He was a fierce guardian of halachic justice and truth — the embodiment of Shoftim's ideal judge. He longed to make Aliyah and set out for Israel, though he ultimately returned to Vilna. His Yahrzeit is 19 Tishrei (Chol HaMo'ed Sukkot).",
    },
  ],
  "Ki Teitzei": [
    {
      name: "74 Commandments — The Most Mitzvot in One Parasha",
      type: "event",
      description: "Ki Teitzei contains 74 of the Torah's 613 commandments — more than any other single Parasha. These span war ethics, marriage law, lost property, animal welfare, workers' rights, and honesty in business. The Jewish ideal of a just society is encapsulated in this Parasha's extraordinary density of ethical legislation.",
    },
    {
      name: "Rabbi Yisrael of Rhizhin",
      hebrewName: "רַבִּי יִשְׂרָאֵל מֵרוּז'ין",
      yearCE: "1796–1850",
      type: "yahrzeit",
      description: "The Rizhiner Rebbe, who maintained a royal court and dressed in magnificent clothing as an act of honoring Torah, spoke about Ki Teitzei's laws of human dignity as the foundation of Chassidic life. He taught that the laws protecting a fallen enemy's donkey and a bird's nest reflect the infinite worth of every created being. His Yahrzeit is 3 Cheshvan.",
    },
  ],
  "Ki Tavo": [
    {
      name: "First Fruits — Bikkurim Ceremony",
      type: "event",
      description: "The Bikkurim (first fruits) ceremony described in Ki Tavo is one of the Torah's most beautiful rituals: a farmer brings his first ripened fruit to the Temple and recites a historical confession — 'An Aramean was about to destroy my father...' — spanning from Abraham to the Exodus. The Sages chose this passage for the Passover Haggadah because it contains the entire story of Israel.",
    },
    {
      name: "Rabbi Moshe Feinstein (Rav Moshe)",
      hebrewName: "רַבִּי מֹשֶׁה פַיְינְשְׁטַיְין",
      yearCE: "1895–1986",
      type: "yahrzeit",
      description: "The preeminent Halachic authority for American Jewry and much of the world in the 20th century, Rav Moshe issued tens of thousands of responsa (Igrot Moshe) on questions arising from modern life. Like Ki Tavo's first-fruits declaration of gratitude, Rav Moshe saw expressing hakaras hatov (recognition of good) as foundational to Jewish ethics. His Yahrzeit is 13 Adar.",
    },
  ],
  "Nitzavim": [
    {
      name: "Covenant Renewal Before Entering the Land",
      type: "event",
      description: "On the very last day of his life, Moses gathered all of Israel — 'from your woodchoppers to your water-drawers' — for a national covenant renewal. The Sages teach that every Jewish soul that would ever live was present at this covenant, including future converts. Nitzavim is always read before Rosh Hashanah — the ultimate day of renewal.",
    },
    {
      name: "Rabbi Yoel Teitelbaum (the Satmar Rebbe)",
      hebrewName: "רַבִּי יוֹאֵל טַייטֶלְבּוֹים",
      yearCE: "1887–1979",
      type: "yahrzeit",
      description: "The Satmar Rebbe, one of the most influential Chassidic leaders of the 20th century and Holocaust survivor, rebuilt Satmar Chassidus entirely from the ashes of the Holocaust — a testament to the promise of Nitzavim: 'And you will return to the Lord your God.' His Yahrzeit is 26 Av.",
    },
  ],
  "Vayeilech": [
    {
      name: "Moses's Last Day on Earth — 7 Adar",
      hebrewName: "מֹשֶׁה רַבֵּינוּ",
      type: "event",
      description: "Vayeilech describes Moses's final day of life. On 7 Adar he completed writing the Torah, transferred leadership to Joshua, and composed the song of Ha'azinu. The Talmud (Sotah 13b) records that Moses died at noon on 7 Adar — the same date as his birth 120 years earlier. God Himself buried Moses in a location never revealed.",
    },
    {
      name: "The Mitzvah of Hakhel",
      type: "event",
      description: "Vayeilech commands 'Hakhel' — the gathering of the entire nation every seven years at the Temple during Sukkot, for a public reading of the Torah by the king. Men, women, children, and even strangers were required to attend. This national assembly, more than any institution, ensured the Torah belonged to all Israel equally — not just to scholars.",
    },
  ],
  "Ha'azinu": [
    {
      name: "Moses's Final Song",
      type: "event",
      description: "Ha'azinu is the second of only two songs in the Torah (the other being the Song of the Sea). The Talmud (Nedarim 38a) records that this song was composed through a level of prophecy higher than ordinary speech — Moses was essentially transcribing God's song. The Vilna Gaon noted that the entire history of the Jewish people is encoded within its 70 verses.",
    },
    {
      name: "Shabbat Shuva — Shabbat of Return",
      type: "event",
      description: "Ha'azinu is most often read on Shabbat Shuva — the Shabbat between Rosh Hashanah and Yom Kippur — the most intense period of Jewish introspection. The great rabbis of each generation delivered their most important sermons of the year on this Shabbat. The song of Ha'azinu, witnessing heaven and earth, perfectly frames the awe of these Ten Days of Repentance.",
    },
  ],
  "Vezot HaBracha": [
    {
      name: "Moses Blesses All Twelve Tribes",
      type: "event",
      description: "Moses's final blessings to each tribe — the last words of the Torah — are read on Simchat Torah, the happiest day of the Jewish year. Moses's blessing to each tribe is his final act of love for the people he led for 40 years. The Torah ends with the words 'before the eyes of all Israel' — because Moses's greatness was visible to all who knew him.",
    },
    {
      name: "Moses Rabbeinu's Passing — 7 Adar",
      hebrewName: "מֹשֶׁה רַבֵּינוּ",
      type: "event",
      description: "The Torah's final four verses — recording Moses's death and burial — were written by Joshua according to one Talmudic opinion. The final praise: 'There never arose again in Israel a prophet like Moses, whom God knew face to face' — means not just that no prophet equaled Moses, but that the direct, face-to-face relationship between God and Israel through Moses was unique in all of history.",
    },
  ],
};

export function getParashaAnniversaries(parashaName: string): ParashaAnniversary[] {
  if (!parashaName) return [];
  if (PARASHA_ANNIVERSARIES[parashaName]) return PARASHA_ANNIVERSARIES[parashaName];
  for (const key of Object.keys(PARASHA_ANNIVERSARIES)) {
    if (parashaName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(parashaName.toLowerCase())) {
      return PARASHA_ANNIVERSARIES[key];
    }
  }
  return [];
}

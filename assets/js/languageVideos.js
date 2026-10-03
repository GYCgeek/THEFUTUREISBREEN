document.getElementById('languageSelector').addEventListener('change', function() {
    var language = this.value;
    updateVideos(language);
});

function updateVideos(language) {
    var videoUrls = {
        english: {
            "Chapter 1": "-Z0GaR7bIOQ",
            "Chapter 2": "IczMPOsYf0g",
            "Chapter 3": "f1FDTctrusc",
            "Chapter 4": "nResaHDxSEw",
            "Chapter 5": "FVRu1I81GtE",
            "Chapter 6": "6PNPDuOV9ns",
            "Chapter 7": "rckpD4t6wMg"
        },
        spanish: {
            "Chapter 1": "n_luetTpQZw",
            "Chapter 2": "IYfUs88uZ78",
            "Chapter 3": "ixT_fMkWdbs",
            "Chapter 4": "ujZQCUnd2UQ",
            "Chapter 5": "fJxUJWugBr4",
            "Chapter 6": "hL_2t-BpWt8",
            "Chapter 7": "1uvx171Vr_A"
        },
        french: {
            "Chapter 2": "OFRln4thSL0",
            "Chapter 3": "TCliDslnSxI",
            "Chapter 4": "gbUFOiNadNo",
            "Chapter 5": "U2X7d68sBIs",
            "Chapter 6": "Lzdbp0puFoY",
            "Chapter 7": "LFoTxphLXMI"
        },
        portuguese: {
            "Chapter 1": "OxNS8dl6aK4",
            "Chapter 2": "NNGvB_PnfyU",
            "Chapter 3": "nLwCQuG0oNk",
            "Chapter 4": "7e8cv_1PxLE",
            "Chapter 5": "FVRu1I81GtE",
            "Chapter 6": "8mxvsWoYBwE",
            "Chapter 7": "_1jLFwbu_ko"
        }
    };

    ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven'].forEach(function(chapterSuffix, index) {
        var chapterKey = "Chapter " + (index + 1);
        var videoId = videoUrls[language][chapterKey];
        var iframe = document.querySelector('#collapse' + chapterSuffix + ' iframe');
        if (!iframe) {
            return;
        }
        var sessionCard = iframe.closest('.card');
        if (videoId) {
            iframe.src = `https://www.youtube.com/embed/${videoId}?rel=0`;
            if (sessionCard) {
                sessionCard.hidden = false;
            }
        } else {
            iframe.removeAttribute('src');
            if (sessionCard) {
                sessionCard.hidden = true;
            }
        }
    });
}

updateVideos(document.getElementById('languageSelector').value);

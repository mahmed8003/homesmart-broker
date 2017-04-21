'use strict';


class Utils {

	/**
	 * Return parts of topic, or null
	 * @param topic
	 * @returns {{device: string, action: string}}
	 */
	static topicParts(topic) {
		const i = topic.lastIndexOf('/');
		if(i == -1) {
			//return null;
		}

		return {
			device : topic.substring(0, i),
			action : topic.substring(i + 1)
		};
	}

}


module.exports = Utils;

import React from 'react';
import Page from "~/components/Page";
import CachedRequest from '~/components/molecules/CachedRequest';

export default () => {

    const render = (...a) => {
        return (
            <div>yeet</div>
        );
    };

    return (
        <Page>
            <CachedRequest endpoint="/api/owner">
                {render}
            </CachedRequest>
        </Page>
    );
}
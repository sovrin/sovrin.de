import React, {Fragment} from 'react';
import App from 'next/app';
import Head from 'next/head';

import '../styles/base.css';
import '../styles/utilities.css';
import '../styles/index.css';

export default class Document extends App {
    render() {
        const {Component, pageProps} = this.props;

        return (
            <Fragment>
                <Head>
                    <link
                        href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono"
                        rel="stylesheet"
                    />
                </Head>

                <Component {...pageProps} />
            </Fragment>
        );
    }
}